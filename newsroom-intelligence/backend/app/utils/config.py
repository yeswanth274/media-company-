import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # LLM Settings
    LLM_PROVIDER: str = "groq"
    LLM_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_BASE_URL: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    # Embedding & RAG Settings
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    TOP_K: int = 10
    CHUNK_SIZE: int = 900
    CHUNK_OVERLAP: int = 120

    # Paths (relative to backend dir or absolute)
    DATABASE_PATH: str = str(BASE_DIR / "data" / "newsroom.db")
    FAISS_INDEX_PATH: str = str(BASE_DIR / "data" / "faiss" / "index.faiss")
    FAISS_MAPPING_PATH: str = str(BASE_DIR / "data" / "faiss" / "id_map.json")
    DOCUMENTS_DIR: str = str(BASE_DIR / "data" / "documents")
    PROCESSED_DIR: str = str(BASE_DIR / "data" / "processed")

    # App Settings
    APP_NAME: str = "Newsroom Intelligence"
    DEBUG: bool = True
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "*"]

settings = Settings()

# Ensure required directories exist
for path_str in [
    Path(settings.DATABASE_PATH).parent,
    Path(settings.FAISS_INDEX_PATH).parent,
    Path(settings.DOCUMENTS_DIR),
    Path(settings.PROCESSED_DIR)
]:
    path_str.mkdir(parents=True, exist_ok=True)
