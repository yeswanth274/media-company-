import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.utils.config import settings
from app.utils.logging import logger
from app.database.database import init_database
from app.api.documents import router as documents_router
from app.api.search import router as search_router
from app.api.ask import router as ask_router
from app.api.research import router as research_router
from app.api.statistics import router as statistics_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Newsroom Intelligence Backend...")
    init_database()
    logger.info(f"Connected to SQLite database at: {settings.DATABASE_PATH}")
    yield
    logger.info("Shutting down Newsroom Intelligence Backend.")

app = FastAPI(
    title="Newsroom Intelligence API",
    description="AI-powered archival research with evidence-backed answers for journalists.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(statistics_router)
app.include_router(documents_router)
app.include_router(search_router)
app.include_router(ask_router)
app.include_router(research_router)

@app.get("/")
def root():
    return {
        "app": "Newsroom Intelligence",
        "tagline": "AI-powered archival research with evidence-backed answers.",
        "version": "1.0.0",
        "status": "operational",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
