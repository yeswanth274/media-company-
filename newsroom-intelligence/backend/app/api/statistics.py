from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.database.models import NewsroomStats
from app.database.repositories import StatisticsRepository
from app.vectorstore.faiss_store import faiss_store
from app.utils.config import settings

router = APIRouter(prefix="", tags=["statistics"])

class SettingsUpdateRequest(BaseModel):
    llm_provider: Optional[str] = None
    llm_model: Optional[str] = None
    groq_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    ollama_base_url: Optional[str] = None

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "faiss_vectors": faiss_store.total_vectors(),
        "llm_provider": settings.LLM_PROVIDER,
        "embedding_model": settings.EMBEDDING_MODEL
    }

@router.get("/statistics", response_model=NewsroomStats)
def get_statistics():
    return StatisticsRepository.get_stats()

@router.get("/settings")
def get_settings():
    return {
        "llm_provider": settings.LLM_PROVIDER,
        "llm_model": settings.LLM_MODEL,
        "embedding_model": settings.EMBEDDING_MODEL,
        "top_k": settings.TOP_K,
        "chunk_size": settings.CHUNK_SIZE,
        "chunk_overlap": settings.CHUNK_OVERLAP,
        "has_groq_key": bool(settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip()),
        "has_openai_key": bool(settings.OPENAI_API_KEY and settings.OPENAI_API_KEY.strip()),
        "has_gemini_key": bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip()),
        "ollama_base_url": settings.OLLAMA_BASE_URL,
        "faiss_total_vectors": faiss_store.total_vectors()
    }

@router.post("/settings")
def update_settings(req: SettingsUpdateRequest):
    if req.llm_provider:
        settings.LLM_PROVIDER = req.llm_provider
    if req.llm_model:
        settings.LLM_MODEL = req.llm_model
    if req.groq_api_key is not None:
        settings.GROQ_API_KEY = req.groq_api_key
    if req.openai_api_key is not None:
        settings.OPENAI_API_KEY = req.openai_api_key
    if req.gemini_api_key is not None:
        settings.GEMINI_API_KEY = req.gemini_api_key
    if req.ollama_base_url:
        settings.OLLAMA_BASE_URL = req.ollama_base_url

    return {
        "status": "updated",
        "llm_provider": settings.LLM_PROVIDER,
        "llm_model": settings.LLM_MODEL,
        "has_groq_key": bool(settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip()),
        "has_openai_key": bool(settings.OPENAI_API_KEY and settings.OPENAI_API_KEY.strip()),
        "has_gemini_key": bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip())
    }
