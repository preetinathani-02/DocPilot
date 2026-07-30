from fastapi import APIRouter
from fastapi import UploadFile
from fastapi import File

from app.services.file_service import save_file
from app.services.parser_service import parse_document

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

    return {
        "filename": file.filename,
        "characters": len(text),
        "preview": text[:1000]
    }