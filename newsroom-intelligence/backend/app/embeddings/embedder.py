import numpy as np
from typing import List
from app.utils.config import settings
from app.utils.logging import logger

class Embedder:
    _instance = None

    def __init__(self, model_name: str = settings.EMBEDDING_MODEL):
        self.model_name = model_name
        self._model = None
        self._dimension = 384
        self._backend = None

    def _load_model(self):
        if self._model is not None:
            return

        # Attempt 1: FastEmbed (ONNX Runtime - ultra-low RAM footprint <50MB, perfectly fits Render free tier)
        try:
            from fastembed import TextEmbedding
            logger.info("Initializing lightweight ONNX embedding model via FastEmbed...")
            self._model = TextEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
            self._backend = "fastembed"
            self._dimension = 384
            logger.info("FastEmbed model initialized successfully.")
            return
        except Exception as e:
            logger.warning(f"FastEmbed not available or failed ({e}). Falling back to sentence-transformers...")

        # Attempt 2: SentenceTransformers (CPU fallback)
        try:
            from sentence_transformers import SentenceTransformer
            logger.info(f"Loading SentenceTransformer: {self.model_name}...")
            self._model = SentenceTransformer(self.model_name)
            self._backend = "sentence_transformers"
            if hasattr(self._model, "get_embedding_dimension"):
                self._dimension = self._model.get_embedding_dimension()
            else:
                self._dimension = self._model.get_sentence_embedding_dimension()
            logger.info(f"SentenceTransformer loaded. Dimension: {self._dimension}")
        except Exception as e:
            logger.error(f"Failed to load embedding engine: {e}")
            raise RuntimeError(f"Embedding model initialization failed: {e}")

    @property
    def dimension(self) -> int:
        return self._dimension

    def embed_texts(self, texts: List[str]) -> np.ndarray:
        """Generates normalized L2 embeddings for a list of texts."""
        if not texts:
            return np.empty((0, self.dimension), dtype=np.float32)

        self._load_model()
        if self._backend == "fastembed":
            embeddings = list(self._model.embed(texts))
            arr = np.array(embeddings, dtype=np.float32)
            norms = np.linalg.norm(arr, axis=1, keepdims=True)
            norms[norms == 0] = 1.0
            return arr / norms
        else:
            embeddings = self._model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
            return np.array(embeddings, dtype=np.float32)

    def embed_query(self, query: str) -> np.ndarray:
        """Generates normalized L2 embedding for a single query."""
        self._load_model()
        if self._backend == "fastembed":
            embeddings = list(self._model.embed([query]))
            arr = np.array(embeddings, dtype=np.float32)
            norm = np.linalg.norm(arr, axis=1, keepdims=True)
            if norm[0, 0] != 0:
                arr = arr / norm
            return arr
        else:
            embedding = self._model.encode([query], normalize_embeddings=True, show_progress_bar=False)
            return np.array(embedding, dtype=np.float32)

embedder = Embedder()
