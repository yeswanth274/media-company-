import json
import os
from typing import List, Optional, Dict
from app.utils.config import settings
from app.utils.logging import logger

class VectorMapping:
    def __init__(self, mapping_path: str = settings.FAISS_MAPPING_PATH):
        self.mapping_path = mapping_path
        self.id_to_chunk: List[int] = []
        self.chunk_to_id: Dict[int, int] = {}
        self.load()

    def load(self):
        """Loads mapping array from JSON file."""
        if os.path.exists(self.mapping_path):
            try:
                with open(self.mapping_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        self.id_to_chunk = [int(x) for x in data]
                    elif isinstance(data, dict) and "id_to_chunk" in data:
                        self.id_to_chunk = [int(x) for x in data["id_to_chunk"]]
                    else:
                        self.id_to_chunk = []
                self.chunk_to_id = {chunk_id: idx for idx, chunk_id in enumerate(self.id_to_chunk)}
                logger.info(f"Loaded {len(self.id_to_chunk)} FAISS ID mappings.")
            except Exception as e:
                logger.error(f"Failed to load vector mapping: {e}")
                self.id_to_chunk = []
                self.chunk_to_id = {}
        else:
            self.id_to_chunk = []
            self.chunk_to_id = {}

    def save(self):
        """Saves mapping array to JSON file."""
        os.makedirs(os.path.dirname(self.mapping_path), exist_ok=True)
        try:
            with open(self.mapping_path, "w", encoding="utf-8") as f:
                json.dump(self.id_to_chunk, f, indent=2)
            logger.info(f"Saved {len(self.id_to_chunk)} FAISS ID mappings to {self.mapping_path}.")
        except Exception as e:
            logger.error(f"Failed to save vector mapping: {e}")

    def add(self, chunk_ids: List[int]):
        """Appends chunk_ids to mapping and updates index."""
        start_idx = len(self.id_to_chunk)
        for i, chunk_id in enumerate(chunk_ids):
            self.id_to_chunk.append(chunk_id)
            self.chunk_to_id[chunk_id] = start_idx + i
        self.save()

    def get_chunk_id(self, faiss_idx: int) -> Optional[int]:
        """Gets SQLite chunk_id from FAISS index position."""
        if 0 <= faiss_idx < len(self.id_to_chunk):
            return self.id_to_chunk[faiss_idx]
        return None

    def get_faiss_idx(self, chunk_id: int) -> Optional[int]:
        """Gets FAISS index position from SQLite chunk_id."""
        return self.chunk_to_id.get(chunk_id)

    def clear(self):
        """Clears the mapping."""
        self.id_to_chunk = []
        self.chunk_to_id = {}
        self.save()

    def count(self) -> int:
        return len(self.id_to_chunk)

vector_mapping = VectorMapping()
