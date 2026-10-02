from typing import List, Optional
import uuid

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchValue,
    PointStruct,
    VectorParams,
)

from app.core.config import settings
from app.schemas.document import Chunk
from app.services.embedding_service import create_embeddings


client = QdrantClient(
    url=settings.QDRANT_URL,
    api_key=settings.QDRANT_API_KEY,
)


def create_collection() -> None:
    """
    Create the Qdrant collection if it doesn't already exist.
    """

    collections = client.get_collections()

    existing_collections = {
        collection.name for collection in collections.collections
    }

    if settings.COLLECTION_NAME in existing_collections:
        return

    client.create_collection(
        collection_name=settings.COLLECTION_NAME,
        vectors_config=VectorParams(
            size=settings.EMBEDDING_DIMENSION,
            distance=Distance.COSINE,
        ),
    )


def store_chunks(
    chunks: List[Chunk],
    document_id: str,
    owner_id: str,
) -> None:
    """
    Generate embeddings for chunks and store them in Qdrant, tagged with
    the owning user so retrieval can be scoped per-user.
    """

    if not chunks:
        return

    # Generate embeddings in a single batch (much faster)
    texts = [chunk.text for chunk in chunks]
    embeddings = create_embeddings(texts)

    points: List[PointStruct] = []

    for chunk, embedding in zip(chunks, embeddings):

        points.append(
            PointStruct(
                id=str(uuid.uuid4()),
                vector=embedding,
                payload={
                    "document_id": document_id,
                    "owner_id": str(owner_id),
                    "chunk_id": chunk.chunk_id,
                    "filename": chunk.metadata["source"],
                    "text": chunk.text,
                },
            )
        )

    client.upsert(
        collection_name=settings.COLLECTION_NAME,
        points=points,
    )


def _owner_filter(owner_id: str) -> Filter:
    return Filter(
        must=[FieldCondition(key="owner_id", match=MatchValue(value=str(owner_id)))]
    )


def search_similar_chunks(
    query: str,
    owner_id: str,
    limit: int = 5,
):
    """Search chunks belonging only to `owner_id` — enforces per-user data isolation."""
    query_embedding = create_embeddings(query)
    results = client.query_points(
        collection_name=settings.COLLECTION_NAME,
        query=query_embedding,
        query_filter=_owner_filter(owner_id),
        limit=limit,
    ).points

    response = []
    for result in results:

        response.append(
            {
                "score": result.score,
                "text": result.payload["text"],
                "filename": result.payload["filename"],
                "document_id": result.payload["document_id"],
                "chunk_id": result.payload["chunk_id"],
            }
        )

    return response


def delete_document_vectors(document_id: str, owner_id: str) -> None:
    """Delete all chunks for a document, scoped to its owner."""
    client.delete(
        collection_name=settings.COLLECTION_NAME,
        points_selector=Filter(
            must=[
                FieldCondition(key="document_id", match=MatchValue(value=document_id)),
                FieldCondition(key="owner_id", match=MatchValue(value=str(owner_id))),
            ]
        ),
    )


def health_check() -> bool:
    """
    Verify Qdrant connection.
    """

    try:
        client.get_collections()
        return True
    except Exception:
        return False
