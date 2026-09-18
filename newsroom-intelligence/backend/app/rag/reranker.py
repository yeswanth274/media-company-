import re
from typing import List
from app.database.models import SearchResultChunk
from app.utils.text_utils import extract_content_terms

class EvidenceReranker:
    @staticmethod
    def rerank(query: str, chunks: List[SearchResultChunk]) -> List[SearchResultChunk]:
        """
        Lightweight lexical + semantic score adjustment:
        Boosts chunks that contain exact query keyword hits (entities, years, names).
        """
        if not chunks or not query:
            return chunks

        query_terms = extract_content_terms(query)
        years = re.findall(r"\b(19\d\d|20\d\d)\b", query)

        scored_chunks = []
        for chunk in chunks:
            boost = 0.0
            text_lower = (chunk.text or "").lower()
            title_lower = (chunk.title or "").lower()
            combined_text = f"{title_lower} {text_lower}"
            tokens = set(re.findall(r"[a-zA-Z0-9_\'-]+", combined_text))

            # Boost for year matches
            for y in years:
                if y in text_lower or y in (chunk.date or ""):
                    boost += 0.08

            # Term overlap boost for genuine non-stopwords
            if query_terms:
                overlap = len(query_terms.intersection(tokens))
                boost += (overlap * 0.05)

            new_score = chunk.score + boost
            chunk.score = round(min(new_score, 1.0), 4)
            scored_chunks.append(chunk)

        scored_chunks.sort(key=lambda x: x.score, reverse=True)
        return scored_chunks

reranker = EvidenceReranker()
