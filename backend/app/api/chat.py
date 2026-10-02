from fastapi import APIRouter, Depends

from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.chat import ChatRequest
from app.services.rag_service import chat

router = APIRouter(
    prefix="/api/v1/chat",
    tags=["Chat"],
)


@router.post("/")
def ask(request: ChatRequest, current_user: User = Depends(get_current_user)):
    return chat(
        query=request.query,
        provider=request.provider,
        api_key=request.api_key,
        model=request.model,
        owner_id=current_user.id,
    )
