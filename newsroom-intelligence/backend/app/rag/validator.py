import re
import json
from typing import Dict, Any, List, Tuple
from app.database.models import SearchResultChunk, CitationItem, ConflictItem
from app.database.repositories import ChunkRepository
from app.utils.logging import logger

class CitationValidator:
    @staticmethod
    def validate_and_enrich(
        raw_llm_json: Dict[str, Any],
        retrieved_chunks: List[SearchResultChunk],
        citation_map: Dict[str, SearchResultChunk]
    ) -> Dict[str, Any]:
        """
        Validates LLM response citations:
        1. Verifies cited [S#] exists in citation_map (was retrieved).
        2. Verifies cited chunk exists in SQLite database.
        3. Strips hallucinated citation tags from text or replaces with valid ones.
        4. Reconstructs and enriches full citation metadata for frontend.
        5. Validates conflicts list.
        """
        answer_text = raw_llm_json.get("answer", "")
        evidence_level = raw_llm_json.get("evidence_level", "limited")
        raw_citations = raw_llm_json.get("citations", [])
        raw_key_evidence = raw_llm_json.get("key_evidence", [])
        raw_conflicts = raw_llm_json.get("conflicts", [])

        valid_citation_ids = set(citation_map.keys())
        retrieved_chunk_ids = {c.chunk_id: c for c in retrieved_chunks}

        # 1. Validate citations list
        validated_citations: List[CitationItem] = []
        cited_cids_in_answer = set(re.findall(r"\[(S\d+)\]", answer_text))

        # Check citations provided in the json list
        used_citation_ids = set()
        for cit in raw_citations:
            cid = cit.get("id") if isinstance(cit, dict) else str(cit)
            if cid in valid_citation_ids:
                source_chunk = citation_map[cid]
                # Verify chunk exists in DB
                db_chunk = ChunkRepository.get_by_id(source_chunk.chunk_id)
                if db_chunk:
                    used_citation_ids.add(cid)
                    validated_citations.append(CitationItem(
                        id=cid,
                        chunk_id=source_chunk.chunk_id,
                        title=source_chunk.title,
                        author=source_chunk.author,
                        publication=source_chunk.publication,
                        date=source_chunk.date,
                        source_type=source_chunk.source_type,
                        page=source_chunk.page_number,
                        timestamp=source_chunk.timestamp_start,
                        excerpt=source_chunk.text,
                        relevance_score=source_chunk.score
                    ))
                else:
                    logger.warning(f"Chunk ID {source_chunk.chunk_id} for {cid} not found in SQLite.")
            else:
                logger.warning(f"Rejected hallucinated citation ID: {cid}")

        # If answer mentions [S#] not in json citations list, add it if valid
        for cid in cited_cids_in_answer:
            if cid in valid_citation_ids and cid not in used_citation_ids:
                source_chunk = citation_map[cid]
                db_chunk = ChunkRepository.get_by_id(source_chunk.chunk_id)
                if db_chunk:
                    used_citation_ids.add(cid)
                    validated_citations.append(CitationItem(
                        id=cid,
                        chunk_id=source_chunk.chunk_id,
                        title=source_chunk.title,
                        author=source_chunk.author,
                        publication=source_chunk.publication,
                        date=source_chunk.date,
                        source_type=source_chunk.source_type,
                        page=source_chunk.page_number,
                        timestamp=source_chunk.timestamp_start,
                        excerpt=source_chunk.text,
                        relevance_score=source_chunk.score
                    ))

        # 2. Sanitize answer text: remove any [S#] tags that are invalid
        def sanitize_tag(match):
            tag_id = match.group(1)
            if tag_id in used_citation_ids:
                return match.group(0)
            return ""  # strip fake citation

        cleaned_answer = re.sub(r"\[(S\d+)\]", sanitize_tag, answer_text)

        # 3. Clean key evidence items
        validated_key_evidence = []
        for ke in raw_key_evidence:
            if isinstance(ke, dict):
                text = ke.get("text", "")
                cits = [c for c in ke.get("citations", []) if c in used_citation_ids]
                if text and cits:
                    validated_key_evidence.append({
                        "text": text,
                        "citations": cits
                    })

        # 4. Clean conflicts
        validated_conflicts = []
        for conf in raw_conflicts:
            if isinstance(conf, dict):
                issue = conf.get("issue", "Historical Discrepancy")
                desc = conf.get("description", "")
                conf_sources = [s for s in conf.get("conflicting_sources", []) if s in valid_citation_ids]
                if desc:
                    validated_conflicts.append(ConflictItem(
                        issue=issue,
                        description=desc,
                        conflicting_sources=conf_sources
                    ))

        # Adjust evidence level
        if not validated_citations or evidence_level == "insufficient" or "insufficient" in cleaned_answer.lower():
            evidence_level = "insufficient"
            validated_citations = []
            validated_key_evidence = []
            validated_conflicts = []
            if not cleaned_answer or "insufficient" not in cleaned_answer.lower():
                cleaned_answer = "The archive evidence available is insufficient to answer this confidently, as no matching records were found in the indexed documents."

        return {
            "answer": cleaned_answer.strip(),
            "evidence_level": evidence_level,
            "key_evidence": validated_key_evidence,
            "conflicts": validated_conflicts,
            "citations": validated_citations,
            "validation_status": "valid"
        }

validator = CitationValidator()
