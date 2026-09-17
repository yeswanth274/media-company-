import httpx
from typing import Optional
from app.llm.base import LLMProvider
from app.utils.config import settings
from app.utils.logging import logger

class OllamaProvider(LLMProvider):
    def __init__(self, base_url: Optional[str] = None, model: Optional[str] = None):
        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")
        self.model = model or "llama3.2"

    @property
    def provider_name(self) -> str:
        return "ollama"

    def is_configured(self) -> bool:
        return True  # Local endpoint

    def generate(self, system_prompt: str, user_prompt: str, temperature: float = 0.0) -> str:
        url = f"{self.base_url}/api/chat"

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "options": {"temperature": temperature},
            "format": "json",
            "stream": False
        }

        try:
            with httpx.Client(timeout=60.0) as client:
                response = client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()
                return data["message"]["content"]
        except Exception as e:
            logger.error(f"Ollama API call failed: {e}")
            raise
