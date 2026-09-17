import httpx
from typing import Optional
from app.llm.base import LLMProvider
from app.utils.config import settings
from app.utils.logging import logger

class GeminiProvider(LLMProvider):
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model = model or "gemini-1.5-flash"

    @property
    def provider_name(self) -> str:
        return "gemini"

    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    def generate(self, system_prompt: str, user_prompt: str, temperature: float = 0.0) -> str:
        if not self.is_configured():
            raise ValueError("Gemini API key is not configured. Please set GEMINI_API_KEY in .env.")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": f"SYSTEM INSTRUCTIONS:\n{system_prompt}\n\nUSER REQUEST:\n{user_prompt}"}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": temperature,
                "responseMimeType": "application/json"
            }
        }

        try:
            with httpx.Client(timeout=45.0) as client:
                response = client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return text
        except Exception as e:
            logger.error(f"Gemini API call failed: {e}")
            raise
