import httpx
from typing import Optional
from app.llm.base import LLMProvider
from app.utils.config import settings
from app.utils.logging import logger

class OpenAIProvider(LLMProvider):
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model = model or ("gpt-4o-mini" if settings.LLM_PROVIDER == "openai" else settings.LLM_MODEL)
        self.base_url = base_url or settings.OPENAI_BASE_URL or "https://api.openai.com/v1/chat/completions"

    @property
    def provider_name(self) -> str:
        return "openai"

    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    def generate(self, system_prompt: str, user_prompt: str, temperature: float = 0.0) -> str:
        if not self.is_configured():
            raise ValueError("OpenAI API key is not configured. Please set OPENAI_API_KEY in .env.")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": temperature,
            "response_format": {"type": "json_object"}
        }

        try:
            with httpx.Client(timeout=45.0) as client:
                response = client.post(self.base_url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
        except Exception as e:
            logger.error(f"OpenAI API call failed: {e}")
            raise
