from pydantic import BaseModel

class SearchRequest(BaseModel):
    query: str

class SearchResult(BaseModel):
    score: float
    text: str
    filename: str
    document_id: str
    chunk_id: int