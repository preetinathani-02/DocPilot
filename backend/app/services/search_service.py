from app.services.vector_service import search_similar_chunks


def retrieve_context(query: str, owner_id: str):

    results = search_similar_chunks(query, owner_id=owner_id)

    contexts = []

    for result in results:
        contexts.append(
            {
                "text": result["text"],
                "filename": result["filename"],
                "chunk_id": result["chunk_id"],
                "score": result["score"],
            }
        )

    return contexts
