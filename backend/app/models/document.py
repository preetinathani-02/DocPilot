import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func

from app.core.database import Base
from app.models.user import GUID


class Document(Base):
    """
    Metadata row for an uploaded document, scoped to the owning user.

    The actual text chunks/embeddings live in Qdrant (see vector_service),
    keyed by document_id and tagged with owner_id so retrieval can be
    filtered per-user. This table is the source of truth for "who owns
    what" and powers the documents list/delete endpoints.
    """

    __tablename__ = "documents"

    id = Column(String(36), primary_key=True)  # matches the Qdrant document_id
    owner_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    filename = Column(String(512), nullable=False)
    content_type = Column(String(128), nullable=True)
    size_bytes = Column(Integer, nullable=True)
    chunk_count = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
