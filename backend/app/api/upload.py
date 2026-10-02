import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.document import Document
from app.models.user import User
from app.services.chunking_service import create_chunks
from app.services.file_service import save_file
from app.services.parser_service import parse_document
from app.services.vector_service import create_collection, store_chunks

upload_router = APIRouter(
    prefix="/api/v1/upload",
    tags=["Upload"]
)

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".xlsx", ".txt", ".csv"}
MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB


@upload_router.post("/")
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type '{ext}'.")

    file_path = await save_file(file, owner_id=current_user.id)

    if os.path.getsize(file_path) > MAX_FILE_SIZE_BYTES:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail="File exceeds the 25 MB size limit.")

    text = parse_document(file_path)

    chunks = create_chunks(
        text=text,
        filename=file.filename
    )

    document_id = str(uuid.uuid4())
    create_collection()
    store_chunks(
        chunks,
        document_id,
        owner_id=current_user.id,
    )

    db.add(
        Document(
            id=document_id,
            owner_id=current_user.id,
            filename=file.filename,
            content_type=file.content_type,
            size_bytes=os.path.getsize(file_path),
            chunk_count=len(chunks),
        )
    )
    db.commit()

    return {
        "document_id": document_id,
        "filename": file.filename,
        "chunks": len(chunks),
        "status": "Indexed successfully"
    }
