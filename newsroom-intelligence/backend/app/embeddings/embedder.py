import numpy as np
from typing import List
from sentence_transformers import SentenceTransformer
from app.utils.config import settings
from app.utils.logging import logger

class Embedder:
    _instance = None

    def __init__(self, model_name: str = settings.EMBEDDING_MODEL):
        self.model_name = model_name
        self._model = None
        self._dimension = None

    @property
    def model(self) -> SentenceTransformer:
        if self._model is None:
            logger.info(f"Loading embedding model: {self.model_name}...")
            self._model = SentenceTransformer(self.model_name)
            # Use get_embedding_dimension if available
            if hasattr(self._model, "get_embedding_dimension"):
                self._dimension = self._model.get_embedding_dimension()
            else:
                self._dimension = self._model.get_sentence_embedding_dimension()
            logger.info(f"Embedding model loaded. Dimension: {self._dimension}")
        return self._model

    @property
    def dimension(self) -> int:
        if self._dimension is None:
            _ = self.model
        return self._dimension

    def embed_texts(self, texts: List[str]) -> np.ndarray:
        """Generates normalized L2 embeddings for a list of texts."""
        if not texts:
            return np.empty((0, self.dimension), dtype=np.float32)
        embeddings = self.model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
        return np.array(embeddings, dtype=np.float32)

    def embed_query(self, query: str) -> np.ndarray:
        """Generates normalized L2 embedding for a single query."""
        embedding = self.model.encode([query], normalize_embeddings=True, show_progress_bar=False)
        return np.array(embedding, dtype=np.float32)

embedder = Embedder()
