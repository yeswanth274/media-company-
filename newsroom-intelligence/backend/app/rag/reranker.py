import re
from typing import List
from app.database.models import SearchResultChunk

class EvidenceReranker:
    @staticmethod
    def rerank(query: str, chunks: List[SearchResultChunk]) -> List[SearchResultChunk]:
        """
        Lightweight lexical + semantic score adjustment:
        Boosts chunks that contain exact query keyword hits (entities, years, names).
        """
        if not chunks or not query:
            return chunks

        query_terms = set(re.findall(r"\b\w{3,}\b", query.lower()))
        
        scored_chunks = []
        for chunk in chunks:
            boost = 0.0
            text_lower = chunk.text.lower()
            title_lower = chunk.title.lower()

            # Boost for year matches
            years = re.findall(r"\b(19\d\d|20\d\d)\b", query)
            for y in years:
                if y in text_lower or y in (chunk.date or ""):
                    boost += 0.08

            # Term overlap boost
            overlap = sum(1 for term in query_terms if term in text_lower or term in title_lower)
            boost += (overlap * 0.02)

            new_score = chunk.score + boost
            chunk.score = round(min(new_score, 1.0), 4)
            scored_chunks.append(chunk)

        scored_chunks.sort(key=lambda x: x.score, reverse=True)
        return scored_chunks

reranker = EvidenceReranker()
