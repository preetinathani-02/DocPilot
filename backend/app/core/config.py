from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Qdrant
    QDRANT_HOST: str
    QDRANT_PORT: int
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

    class Config:
        env_file = ".env"


settings = Settings()