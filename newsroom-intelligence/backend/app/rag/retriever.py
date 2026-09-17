from typing import List, Optional, Dict, Any
from app.embeddings.embedder import embedder
from app.vectorstore.faiss_store import faiss_store
from app.database.repositories import ChunkRepository
from app.database.models import SearchResultChunk
from app.utils.logging import logger

class ArchiveRetriever:
    @staticmethod
    def search(
        query: str,
        top_k: int = 10,
        source_type: Optional[str] = None,
        publication: Optional[str] = None,
        author: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        min_score: float = 0.05
    ) -> List[SearchResultChunk]:
        """
        Retrieves top relevant archive chunks with metadata.
        """
        if not query or not query.strip():
            return []

        # 1. Embed query
        query_vec = embedder.embed_query(query.strip())

        # 2. Fetch candidates from FAISS (fetch 2x top_k to allow for filtering and deduplication)
        fetch_k = max(top_k * 2, 20)
        faiss_results = faiss_store.search(query_vec, top_k=fetch_k)

        if not faiss_results:
            return []

        # Map of chunk_id -> score
        score_map = {cid: score for cid, score in faiss_results}
        chunk_ids = list(score_map.keys())

        # 3. Lookup full metadata in SQLite
        chunks = ChunkRepository.get_by_ids(chunk_ids)

        results: List[SearchResultChunk] = []
        seen_texts = set()

        for c in chunks:
            score = score_map.get(c.id, 0.0)
            if score < min_score:
                continue

            # Apply metadata filters
            if source_type and c.source_type and c.source_type.lower() != source_type.lower():
                continue
            if publication and c.publication and publication.lower() not in c.publication.lower():
                continue
            if author and c.author and author.lower() not in c.author.lower():
                continue
            if date_from and c.publication_date and c.publication_date < date_from:
                continue
            if date_to and c.publication_date and c.publication_date > date_to:
                continue

            # Deduplication: avoid nearly identical text snippets
            text_snippet = c.text[:120].strip().lower()
            if text_snippet in seen_texts:
                continue
            seen_texts.add(text_snippet)

            res = SearchResultChunk(
                chunk_id=c.id,
                score=round(float(score), 4),
                text=c.text,
                document_id=c.document_id,
                title=c.document_title or "Archived Document",
                author=c.author,
                publication=c.publication,
                date=c.publication_date,
                source_type=c.source_type,
                page_number=c.page_number,
                timestamp_start=c.timestamp_start,
                timestamp_end=c.timestamp_end
            )
            results.append(res)

            if len(results) >= top_k:
                break

        return results

retriever = ArchiveRetriever()
