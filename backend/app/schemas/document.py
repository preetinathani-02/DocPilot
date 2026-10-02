from pydantic import BaseModel
from typing import Dict


class Chunk(BaseModel):
    chunk_id: int
    text: str
    metadata: Dict