from typing import List

from pydantic_settings import BaseSettings
from pydantic import field_validator


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

    # ─── Database ─────────────────    winget install --id Git.Git -e --source winget───────────────────────────────────────
    # Defaults to a local SQLite file for zero-config local dev.
    # Use a real database in production, e.g.:
    # postgresql+psycopg://user:password@host:5432/docpilot
    DATABASE_URL: str = "sqlite:///./docpilot.db"

    # ─── Auth / JWT ──────────────────────────────────────────────────────
    # MUST be overridden in production (`openssl rand -hex 32`).
    JWT_SECRET_KEY: str = "insecure-dev-secret-change-me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    REFRESH_TOKEN_COOKIE_NAME: str = "docpilot_refresh_token"

    # Set to True in production (requires HTTPS).
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"
    COOKIE_DOMAIN: str | None = None

    # Basic brute-force protection
    MAX_FAILED_LOGIN_ATTEMPTS: int = 5
    ACCOUNT_LOCKOUT_MINUTES: int = 15

    # ─── Google OAuth ────────────────────────────────────────────────────
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    FRONTEND_URL: str = "http://localhost:5173"

    @field_validator("JWT_SECRET_KEY")
    @classmethod
    def warn_on_insecure_secret(cls, v: str) -> str:
        return v

    class Config:
        env_file = ".env"


settings = Settings()
