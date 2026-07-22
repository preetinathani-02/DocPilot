from fastapi import APIRouter

from app.schemas.chat import ChatRequest
from app.services.rag_service import chat

router = APIRouter(
    prefix="/api/v1/chat",
    tags=["Chat"],
)


@router.post("/")
def ask(request: ChatRequest):
    return chat(
        query=request.query,
        provider=request.provider,
        api_key=request.api_key,
        model=request.model,
    )