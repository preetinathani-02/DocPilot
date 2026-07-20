from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Qdrant
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    COLLECTION_NAME: str = "docpilot"

    # Embedding
    EMBEDDING_DIMENSION: int = 384
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"

    # Chunking
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200

    class Config:
        env_file = ".env"


settings = Settings()