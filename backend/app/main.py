from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api.auth import router as auth_router
from app.api.chat import router as chat_router
from app.api.documents import router as documents_router
from app.api.search import router as search_router
from app.api.settings import router as settings_router
from app.api.upload import upload_router as upload_router
from app.core.config import settings
from app.core.database import init_db
from app.core.limiter import limiter
from app.services.vector_service import create_collection


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs once when FastAPI starts
    init_db()
    create_collection()
    yield
    # Runs when FastAPI shuts down (optional cleanup)

app = FastAPI(
    title="DocPilot API",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(upload_router)
app.include_router(search_router)
app.include_router(chat_router)
app.include_router(settings_router)
app.include_router(documents_router)
