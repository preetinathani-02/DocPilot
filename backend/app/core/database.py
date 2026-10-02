"""
SQLAlchemy database engine and session management.

Defaults to a local SQLite file so the project runs out of the box.
For production, set DATABASE_URL to a real database, e.g.:
    postgresql+psycopg://user:password@host:5432/docpilot

Schema is managed with Alembic migrations (see /backend/alembic).
"""
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import settings

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    # Needed for SQLite when used from multiple threads (FastAPI/uvicorn workers)
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator:
    """FastAPI dependency that yields a scoped DB session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """
    Create tables if they do not exist yet.

    NOTE: This is a convenience for local/dev setups. In production, use
    Alembic migrations (`alembic upgrade head`) instead of relying on
    create_all, so schema changes are versioned and reversible.
    """
    # Import models so they are registered on Base.metadata before create_all
    from app.models import user as _user  # noqa: F401
    from app.models import refresh_token as _refresh_token  # noqa: F401
    from app.models import document as _document  # noqa: F401

    Base.metadata.create_all(bind=engine)
