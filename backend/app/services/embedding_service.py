from sentence_transformers import SentenceTransformer
from app.core.config import settings

_model = None


def get_model():
    global _model

    if _model is None:
        print("Loading embedding model...")
        _model = SentenceTransformer(settings.EMBEDDING_MODEL)

    return _model


def create_embedding(text: str) -> list[float]:
    return get_model().encode(text).tolist()


def create_embeddings(texts: list[str]) -> list[list[float]]:
    return get_model().encode(texts).tolist()