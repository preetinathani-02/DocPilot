from sentence_transformers import SentenceTransformer

from app.core.config import settings


model = SentenceTransformer(
    settings.EMBEDDING_MODEL
)


def create_embedding(text: str) -> list[float]:
    return model.encode(text).tolist()


def create_embeddings(texts: list[str]) -> list[list[float]]:
    return model.encode(texts).tolist()