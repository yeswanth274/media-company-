import sys
from pathlib import Path

# Add backend root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database.database import init_database
from app.database.repositories import ChunkRepository
from app.vectorstore.faiss_store import faiss_store
from app.utils.logging import logger

if __name__ == "__main__":
    init_database()
    logger.info("Fetching all chunks from SQLite for FAISS index reconstruction...")
    chunks = ChunkRepository.get_all_chunks_for_indexing()
    logger.info(f"Rebuilding FAISS index with {len(chunks)} chunks...")
    faiss_store.rebuild(chunks)
    logger.info(f"FAISS index successfully rebuilt with {faiss_store.total_vectors()} vectors.")
