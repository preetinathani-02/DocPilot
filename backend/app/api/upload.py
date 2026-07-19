from fastapi import APIRouter
from fastapi import UploadFile
from fastapi import File

from app.services.file_service import save_file
from app.services.parser_service import parse_document
from app.services.chucking_service import create_chunks

router = APIRouter(
    prefix="/api/v1/upload",
    tags=["Upload"]
)

@router.post("/")
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

    return {
        "filename": file.filename,
        "characters": len(text),
        "chunks": len(chunks),
        "preview": chunks[0].text
    }