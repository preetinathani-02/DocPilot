from fastapi import APIRouter
from fastapi import UploadFile
from fastapi import File
import uuid

from app.services.file_service import save_file
from app.services.parser_service import parse_document
from app.services.chunking_service import create_chunks
from app.services.vector_service import create_collection, store_chunks

upload_router = APIRouter(
    prefix="/api/v1/upload",
    tags=["Upload"]
)

@upload_router.post("/")
async def upload_document(
    file: UploadFile = File(...)
):

    file_path = await save_file(file)

    text = parse_document(
        file_path
    )

    chunks = create_chunks(
        text=text,
        filename=file.filename
    )

    document_id = str(uuid.uuid4())
    create_collection()
    store_chunks(
        chunks,
        document_id
    )

    return {
        "document_id": document_id,
        "filename": file.filename,
        "chunks": len(chunks),
        "status": "Indexed successfully"
    }