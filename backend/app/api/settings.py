from fastapi import APIRouter, Depends

from app.core.deps import get_current_user
from app.core.session import llm_config
from app.models.user import User
from app.schemas.settings import LLMSettings

router = APIRouter(
    prefix="/api/v1/settings",
    tags=["Settings"],
)


@router.post("/llm")
def save_llm_settings(settings: LLMSettings, current_user: User = Depends(get_current_user)):
    # NOTE: LLM provider credentials are supplied per-request from the
    # client today (see ChatRequest.api_key) rather than persisted, since
    # this in-memory dict is process-global and not safe to share across
    # users. Kept here only for backward compatibility with the frontend.
    llm_config["provider"] = settings.provider
    llm_config["api_key"] = settings.api_key
    llm_config["model"] = settings.model

    return {
        "message": "LLM settings saved successfully."
    }
