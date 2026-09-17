import os
import faiss
import numpy as np
from typing import List, Tuple, Dict, Any, Optional
from app.utils.config import settings
from app.utils.logging import logger
from app.vectorstore.mapping import vector_mapping
from app.embeddings.embedder import embedder

class FAISSVectorStore:
    def __init__(self, index_path: str = settings.FAISS_INDEX_PATH):
        self.index_path = index_path
        self.index = None
        self._init_index()

    def _init_index(self):
        """Initializes or loads the FAISS index."""
        if os.path.exists(self.index_path):
            try:
                self.index = faiss.read_index(self.index_path)
                logger.info(f"Loaded existing FAISS index from {self.index_path} with {self.index.ntotal} vectors.")
            except Exception as e:
                logger.error(f"Failed to load FAISS index from {self.index_path}: {e}")
                self._create_empty_index()
        else:
            self._create_empty_index()

    def _create_empty_index(self):
        dimension = embedder.dimension
        # IndexFlatIP calculates inner product, which equals cosine similarity for L2-normalized vectors
        self.index = faiss.IndexFlatIP(dimension)
        logger.info(f"Created new FAISS IndexFlatIP with dimension {dimension}.")

    def save(self):
        """Persists the FAISS index to disk."""
        os.makedirs(os.path.dirname(self.index_path), exist_ok=True)
        try:
            faiss.write_index(self.index, self.index_path)
            logger.info(f"FAISS index saved to {self.index_path} ({self.index.ntotal} vectors).")
        except Exception as e:
            logger.error(f"Failed to save FAISS index: {e}")

    def add_vectors(self, chunk_ids: List[int], texts: List[str]):
        """Embeds texts, adds vectors to FAISS, and updates vector mapping."""
        if not texts or not chunk_ids or len(texts) != len(chunk_ids):
            logger.warning("add_vectors called with mismatched or empty inputs.")
            return

        embeddings = embedder.embed_texts(texts)
        self.index.add(embeddings)
        vector_mapping.add(chunk_ids)
        self.save()
        logger.info(f"Added {len(chunk_ids)} vectors to FAISS. Total index size: {self.index.ntotal}")

    def search(self, query_embedding: np.ndarray, top_k: int = 15) -> List[Tuple[int, float]]:
        """
        Searches FAISS for top_k nearest neighbors.
        Returns list of (chunk_id, similarity_score) tuples.
        """
        if self.index is None or self.index.ntotal == 0:
            logger.warning("FAISS search called on empty index.")
            return []

        actual_k = min(top_k, self.index.ntotal)
        if actual_k == 0:
            return []

        distances, indices = self.index.search(query_embedding, actual_k)
        results = []
        for dist, faiss_idx in zip(distances[0], indices[0]):
            if faiss_idx == -1:
                continue
            chunk_id = vector_mapping.get_chunk_id(int(faiss_idx))
            if chunk_id is not None:
                results.append((chunk_id, float(dist)))

        return results

    def rebuild(self, chunk_items: List[Dict[str, Any]]):
        """
        Completely rebuilds the FAISS index and mapping from a list of chunk dicts:
        [{'chunk_id': 1, 'text': '...'}, ...]
        """
        logger.info(f"Rebuilding FAISS index with {len(chunk_items)} chunks...")
        self._create_empty_index()
        vector_mapping.clear()

        if not chunk_items:
            self.save()
            return

        chunk_ids = [item["chunk_id"] for item in chunk_items]
        texts = [item["text"] for item in chunk_items]

        # Batch in chunks of 256 for memory efficiency
        batch_size = 256
        for i in range(0, len(texts), batch_size):
            b_texts = texts[i:i + batch_size]
            b_ids = chunk_ids[i:i + batch_size]
            embeddings = embedder.embed_texts(b_texts)
            self.index.add(embeddings)
            vector_mapping.add(b_ids)

        self.save()
        logger.info(f"FAISS index rebuilt with {self.index.ntotal} vectors.")

    def total_vectors(self) -> int:
        return self.index.ntotal if self.index else 0

faiss_store = FAISSVectorStore()
