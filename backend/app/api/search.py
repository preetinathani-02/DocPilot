from fastapi import APIRouter, Depends

from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.search import SearchRequest
from app.services.search_service import retrieve_context

router = APIRouter(
    prefix="/api/v1/search",
    tags=["Search"],
)


@router.post("/")
def search(request: SearchRequest, current_user: User = Depends(get_current_user)):

    results = retrieve_context(
        request.query,
        owner_id=current_user.id,
    )

    return {
        "matches": results
    }
