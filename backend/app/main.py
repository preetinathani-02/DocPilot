from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.upload import upload_router as upload_router
from app.api.search import router as search_router
from app.api.chat import router as chat_router
from app.services.vector_service import create_collection
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs once when FastAPI starts
    create_collection()
    yield
    # Runs when FastAPI shuts down (optional cleanup)
    
app = FastAPI(
    title="DocPilot API",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router)
app.include_router(search_router)
app.include_router(chat_router)



