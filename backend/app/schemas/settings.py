from pydantic import BaseModel


class LLMSettings(BaseModel):
    provider: str
    api_key: str
    model: str