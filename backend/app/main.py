from fastapi import FastAPI

app = FastAPI(
    title="DocPilot AI"
)

from app.api.upload import router as upload_router

app.include_router(upload_router)