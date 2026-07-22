from fastapi import APIRouter

from app.schemas.settings import LLMSettings
from app.core.session import llm_config

router = APIRouter(
    prefix="/api/v1/settings",
    tags=["Settings"],
)


@router.post("/llm")
def save_llm_settings(settings: LLMSettings):

    llm_config["provider"] = settings.provider
    llm_config["api_key"] = settings.api_key
    llm_config["model"] = settings.model

    return {
        "message": "LLM settings saved successfully."
    }