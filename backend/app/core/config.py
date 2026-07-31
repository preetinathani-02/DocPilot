from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Qdrant
    QDRANT_URL: str
    QDRANT_API_KEY: str
    COLLECTION_NAME: str

    # Embedding
    EMBEDDING_DIMENSION: int
    EMBEDDING_MODEL: str

    # Chunking
    CHUNK_SIZE: int
    CHUNK_OVERLAP: int

    # Gemini 
    GEMINI_API_KEY: str
    LLM_MODEL: str 

    ALLOWED_ORIGINS: List[str]

    class Config:
        env_file = ".env"


settings = Settings()