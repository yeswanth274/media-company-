from abc import ABC, abstractmethod
from typing import Optional

class LLMProvider(ABC):
    @abstractmethod
    def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.0
    ) -> str:
        """
        Generates text response from the LLM provider.
        Default temperature is 0 for deterministic factual synthesis.
        """
        pass

    @abstractmethod
    def is_configured(self) -> bool:
        """Checks if the provider has the necessary configuration/API key."""
        pass

    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass
