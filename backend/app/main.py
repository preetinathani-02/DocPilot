from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.upload import upload_router as upload_router
from app.services.vector_service import create_collection


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

app.include_router(upload_router)