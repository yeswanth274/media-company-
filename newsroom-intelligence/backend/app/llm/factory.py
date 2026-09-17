from typing import Optional
from app.llm.base import LLMProvider
from app.llm.groq_provider import GroqProvider
from app.llm.openai_provider import OpenAIProvider
from app.llm.gemini_provider import GeminiProvider
from app.llm.ollama_provider import OllamaProvider
from app.llm.fallback_provider import FallbackSynthesisProvider
from app.utils.config import settings
from app.utils.logging import logger

def get_llm_provider(
    provider_name: Optional[str] = None,
    api_key: Optional[str] = None,
    model: Optional[str] = None
) -> LLMProvider:
    name = (provider_name or settings.LLM_PROVIDER).lower()

    if name == "groq":
        provider = GroqProvider(api_key=api_key, model=model)
        if provider.is_configured():
            return provider
        logger.warning("Groq API key not provided or empty; falling back to offline deterministic synthesis.")
        return FallbackSynthesisProvider()

    elif name in ["openai", "openai-compatible"]:
        provider = OpenAIProvider(api_key=api_key, model=model)
        if provider.is_configured():
            return provider
        logger.warning("OpenAI API key not provided; falling back to offline deterministic synthesis.")
        return FallbackSynthesisProvider()

    elif name == "gemini":
        provider = GeminiProvider(api_key=api_key, model=model)
        if provider.is_configured():
            return provider
        logger.warning("Gemini API key not provided; falling back to offline deterministic synthesis.")
        return FallbackSynthesisProvider()

    elif name == "ollama":
        return OllamaProvider(model=model)

    elif name == "fallback":
        return FallbackSynthesisProvider()

    else:
        logger.warning(f"Unknown LLM provider '{name}'. Falling back to deterministic synthesis.")
        return FallbackSynthesisProvider()
