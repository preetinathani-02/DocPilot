from fastapi import APIRouter

from app.schemas.search import SearchRequest
from app.services.search_service import search_documents

router = APIRouter(
    prefix="/api/v1/search",
    tags=["Search"],
)


@router.post("/")
def search(request: SearchRequest):

    results = search_documents(
        request.query
    )

    return {
        "matches": results
    }