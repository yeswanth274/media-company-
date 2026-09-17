import json
import re
from typing import Dict, Any, List, Optional
from app.rag.retriever import retriever
from app.rag.reranker import reranker
from app.rag.prompt import SYSTEM_PROMPT, DEVELOPING_STORY_PROMPT, format_evidence_prompt
from app.rag.validator import validator
from app.llm.factory import get_llm_provider
from app.database.models import AskResponse, ResearchBriefing, TimelineEvent, CitationItem, ConflictItem
from app.database.repositories import QueryRepository, StoryRepository, ChunkRepository
from app.utils.logging import logger

class RAGGenerator:
    def __init__(self):
        pass

    def ask(self, question: str, top_k: int = 10, filters: Optional[Dict[str, Any]] = None) -> AskResponse:
        filters = filters or {}
        # 1. Retrieval
        retrieved_chunks = retriever.search(
            query=question,
            top_k=top_k,
            source_type=filters.get("source_type"),
            publication=filters.get("publication"),
            author=filters.get("author"),
            date_from=filters.get("date_from"),
            date_to=filters.get("date_to")
        )

        # 2. Rerank
        reranked_chunks = reranker.rerank(question, retrieved_chunks)

        # If no chunks found
        if not reranked_chunks:
            return AskResponse(
                question=question,
                answer="No reliable archive evidence was found for this question.",
                evidence_level="insufficient",
                key_evidence=[],
                conflicts=[],
                citations=[],
                retrieved_count=0,
                validation_status="no_evidence"
            )

        # 3. Format Prompt
        user_prompt, citation_map = format_evidence_prompt(question, reranked_chunks)

        # 4. LLM Generation
        provider = get_llm_provider()
        logger.info(f"Generating answer using LLM provider: {provider.provider_name}")

        try:
            raw_response = provider.generate(SYSTEM_PROMPT, user_prompt, temperature=0.0)
            
            # Clean possible markdown wrapper ```json ... ```
            cleaned_json_str = raw_response.strip()
            if cleaned_json_str.startswith("```"):
                cleaned_json_str = re.sub(r"^```(?:json)?\n?", "", cleaned_json_str)
                cleaned_json_str = re.sub(r"\n?```$", "", cleaned_json_str)

            parsed_json = json.loads(cleaned_json_str)
        except Exception as e:
            logger.error(f"LLM generation or parsing error: {e}. Falling back to deterministic synthesis.")
            from app.llm.fallback_provider import FallbackSynthesisProvider
            fallback = FallbackSynthesisProvider()
            raw_response = fallback.generate(SYSTEM_PROMPT, user_prompt, temperature=0.0)
            parsed_json = json.loads(raw_response)

        # 5. Citation Validation
        validated = validator.validate_and_enrich(parsed_json, reranked_chunks, citation_map)

        # 6. Save query and citations to DB
        query_id = None
        try:
            query_id = QueryRepository.create(
                question=question,
                answer=validated["answer"],
                evidence_level=validated["evidence_level"]
            )
            citations_tuples = [
                (c.chunk_id, int(c.id.replace("S", "")), c.relevance_score or 1.0)
                for c in validated["citations"]
            ]
            if citations_tuples:
                QueryRepository.add_citations(query_id, citations_tuples)
        except Exception as e:
            logger.error(f"Failed to record query to database: {e}")

        return AskResponse(
            query_id=query_id,
            question=question,
            answer=validated["answer"],
            evidence_level=validated["evidence_level"],
            key_evidence=validated["key_evidence"],
            conflicts=validated["conflicts"],
            citations=validated["citations"],
            retrieved_count=len(reranked_chunks),
            validation_status=validated["validation_status"]
        )

    def generate_briefing(self, title: str, research_question: str, tags: Optional[str] = "") -> ResearchBriefing:
        """
        Investigative workspace briefing generation for developing stories.
        """
        combined_query = f"{title} {research_question} {tags or ''}"
        retrieved_chunks = retriever.search(query=combined_query, top_k=15)
        reranked_chunks = reranker.rerank(combined_query, retrieved_chunks)

        if not reranked_chunks:
            return ResearchBriefing(
                title=title,
                research_question=research_question,
                background="No archival records found matching this developing story topic.",
                key_developments=[],
                timeline=[],
                key_people=[],
                previous_coverage=[],
                important_claims=[],
                conflicting_accounts=[],
                open_questions=["What archival documents exist for this subject?"],
                sources=[],
                evidence_level="insufficient"
            )

        user_prompt, citation_map = format_evidence_prompt(f"Title: {title}\nQuestion: {research_question}", reranked_chunks)
        provider = get_llm_provider()

        try:
            raw_response = provider.generate(DEVELOPING_STORY_PROMPT, user_prompt, temperature=0.0)
            cleaned_json_str = raw_response.strip()
            if cleaned_json_str.startswith("```"):
                cleaned_json_str = re.sub(r"^```(?:json)?\n?", "", cleaned_json_str)
                cleaned_json_str = re.sub(r"\n?```$", "", cleaned_json_str)
            data = json.loads(cleaned_json_str)
        except Exception as e:
            logger.error(f"Briefing generation fallback: {e}")
            # Fallback structure
            data = {
                "title": title,
                "research_question": research_question,
                "background": f"Archival coverage indicates ongoing reporting regarding {title}.",
                "key_developments": [f"Archived report regarding {title} documented in archive records. [S1]"],
                "timeline": [],
                "key_people": [],
                "previous_coverage": [],
                "important_claims": [],
                "conflicting_accounts": [],
                "open_questions": ["Additional archival documentation required."],
                "evidence_level": "moderate"
            }

        # Build citation items
        sources_list: List[CitationItem] = []
        for cid, chunk in citation_map.items():
            sources_list.append(CitationItem(
                id=cid,
                chunk_id=chunk.chunk_id,
                title=chunk.title,
                author=chunk.author,
                publication=chunk.publication,
                date=chunk.date,
                source_type=chunk.source_type,
                page=chunk.page_number,
                timestamp=chunk.timestamp_start,
                excerpt=chunk.text,
                relevance_score=chunk.score
            ))

        # Format timeline events
        timeline_events: List[TimelineEvent] = []
        for t in data.get("timeline", []):
            s_ids = t.get("source_ids", [])
            matching_cits = [s for s in sources_list if s.id in s_ids]
            timeline_events.append(TimelineEvent(
                date=t.get("date", "Date not established by archive"),
                event=t.get("event", ""),
                source_ids=s_ids,
                citations=matching_cits,
                conflict_note=t.get("conflict_note")
            ))

        # Build conflicting accounts
        conflicts = [
            ConflictItem(
                issue=c.get("issue", "Discrepancy"),
                description=c.get("description", ""),
                conflicting_sources=c.get("conflicting_sources", [])
            )
            for c in data.get("conflicting_accounts", []) if isinstance(c, dict)
        ]

        return ResearchBriefing(
            title=data.get("title", title),
            research_question=data.get("research_question", research_question),
            background=data.get("background", ""),
            key_developments=data.get("key_developments", []),
            timeline=timeline_events,
            key_people=data.get("key_people", []),
            previous_coverage=data.get("previous_coverage", []),
            important_claims=data.get("important_claims", []),
            conflicting_accounts=conflicts,
            open_questions=data.get("open_questions", []),
            sources=sources_list,
            evidence_level=data.get("evidence_level", "strong" if len(sources_list) >= 3 else "moderate")
        )

    def generate_timeline(self, query: str = "timeline", top_k: int = 15) -> List[TimelineEvent]:
        """
        Extracts chronological timeline from archive evidence.
        """
        retrieved_chunks = retriever.search(query=query, top_k=top_k)
        reranked_chunks = reranker.rerank(query, retrieved_chunks)

        if not reranked_chunks:
            return []

        user_prompt, citation_map = format_evidence_prompt(f"Construct a complete chronological timeline for: {query}", reranked_chunks)
        
        timeline_prompt = """You are Newsroom Intelligence. Construct a chronological timeline of events strictly using the retrieved evidence.
RULES:
1. Every event must cite its source [S1].
2. Never invent dates. If a date is not established by evidence, state 'Date not established by retrieved archive evidence'.
3. Highlight any conflicting dates.

Respond with JSON:
{
  "events": [
    {
      "date": "2018-04-12 or 2018",
      "event": "Event description with citation [S1]",
      "source_ids": ["S1"],
      "conflict_note": null
    }
  ]
}"""

        provider = get_llm_provider()
        events_list = []

        try:
            raw = provider.generate(timeline_prompt, user_prompt, temperature=0.0)
            cleaned = raw.strip()
            if cleaned.startswith("```"):
                cleaned = re.sub(r"^```(?:json)?\n?", "", cleaned)
                cleaned = re.sub(r"\n?```$", "", cleaned)
            parsed = json.loads(cleaned)
            raw_events = parsed.get("events", [])
        except Exception:
            raw_events = []
            for cid, c in citation_map.items():
                d = c.date or "Date not established by archive"
                raw_events.append({
                    "date": d,
                    "event": f"Archived reporting: {c.title}. {c.text[:140]}... [{cid}]",
                    "source_ids": [cid],
                    "conflict_note": None
                })

        for e in raw_events:
            s_ids = e.get("source_ids", [])
            cits = []
            for sid in s_ids:
                if sid in citation_map:
                    ch = citation_map[sid]
                    cits.append(CitationItem(
                        id=sid,
                        chunk_id=ch.chunk_id,
                        title=ch.title,
                        publication=ch.publication,
                        date=ch.date,
                        source_type=ch.source_type,
                        page=ch.page_number,
                        timestamp=ch.timestamp_start,
                        excerpt=ch.text
                    ))
            events_list.append(TimelineEvent(
                date=e.get("date", "Date not established by archive"),
                event=e.get("event", ""),
                source_ids=s_ids,
                citations=cits,
                conflict_note=e.get("conflict_note")
            ))

        return events_list

rag_generator = RAGGenerator()
