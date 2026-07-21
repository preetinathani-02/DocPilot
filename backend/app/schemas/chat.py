from pydantic import BaseModel


class ChatRequest(BaseModel):
    query: str


class Source(BaseModel):
    filename: str
    chunk_id: int
    score: float


class ChatResponse(BaseModel):
    answer: str
    sources: list[Source]