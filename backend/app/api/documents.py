from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.document import Document
from app.models.user import User
from app.services.vector_service import delete_document_vectors

router = APIRouter(
    prefix="/api/v1/documents",
    tags=["Documents"],
)


@router.get("/")
def list_documents(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    docs = (
        db.query(Document)
        .filter(Document.owner_id == current_user.id)
        .order_by(Document.created_at.desc())
        .all()
    )
    return [
        {
            "document_id": d.id,
            "filename": d.filename,
            "content_type": d.content_type,
            "size_bytes": d.size_bytes,
            "chunk_count": d.chunk_count,
            "created_at": d.created_at,
        }
        for d in docs
    ]


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = (
        db.query(Document)
        .filter(Document.id == document_id, Document.owner_id == current_user.id)
        .first()
    )
    if doc is None:
        # 404 rather than 403: don't reveal whether the document exists for another user.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    delete_document_vectors(document_id, owner_id=current_user.id)
    db.delete(doc)
    db.commit()
