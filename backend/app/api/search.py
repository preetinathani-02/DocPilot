from fastapi import APIRouter

from app.schemas.search import SearchRequest
from app.services.search_service import retrieve_context

router = APIRouter(
    prefix="/api/v1/search",
    tags=["Search"],
)


@router.post("/")
def search(request: SearchRequest):

    results = retrieve_context(
        request.query
    )

    return {
        "matches": results
    }