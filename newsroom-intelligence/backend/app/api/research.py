import json
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.database.models import (
    ResearchBriefing, StoryCreate, StoryRead, TimelineEvent, AskRequest
)
from app.database.repositories import StoryRepository, DocumentRepository, ChunkRepository
from app.rag.generator import rag_generator
from app.rag.retriever import retriever
from app.utils.logging import logger

router = APIRouter(prefix="", tags=["research"])

@router.post("/research", response_model=ResearchBriefing)
def create_research_briefing(story: StoryCreate):
    """
    Generates an in-depth Investigative Research Briefing for a developing story:
    Background, Timeline, Key People, Previous Coverage, Important Claims, Conflicting Accounts, Open Questions, Sources.
    """
    if not story.title or not story.research_question:
        raise HTTPException(status_code=400, detail="Story title and research question are required.")

    try:
        briefing = rag_generator.generate_briefing(
            title=story.title,
            research_question=story.research_question,
            tags=story.tags
        )
        
        # Save to stories table
        StoryRepository.create(story, briefing_json=briefing.model_dump_json())
        return briefing
    except Exception as e:
        logger.error(f"Failed to generate briefing: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate research briefing: {str(e)}")

@router.get("/stories", response_model=List[StoryRead])
def list_stories():
    return StoryRepository.list_all()

@router.get("/stories/{story_id}", response_model=StoryRead)
def get_story(story_id: int):
    story = StoryRepository.get_by_id(story_id)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    return story

@router.post("/timeline", response_model=List[TimelineEvent])
def generate_timeline(req: AskRequest):
    """
    Constructs a verified chronological timeline of events strictly from archive records.
    """
    try:
        return rag_generator.generate_timeline(query=req.question, top_k=req.top_k or 15)
    except Exception as e:
        logger.error(f"Failed to generate timeline: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate timeline: {str(e)}")

@router.get("/entity/research")
def research_entity(name: str = Query(..., min_length=2)):
    """
    Researches people, organizations, events, or topics across the archive:
    Mentions, associated documents, interview excerpts, dates, and publications.
    """
    try:
        chunks = retriever.search(query=name, top_k=20)
        
        # Calculate mentions and aggregate metadata
        docs_involved = {}
        quotes = []
        timeline_mentions = []

        for c in chunks:
            if name.lower() in c.text.lower() or name.lower() in c.title.lower() or (c.author and name.lower() in c.author.lower()):
                doc_key = c.document_id
                if doc_key not in docs_involved:
                    docs_involved[doc_key] = {
                        "document_id": c.document_id,
                        "title": c.title,
                        "source_type": c.source_type,
                        "publication": c.publication,
                        "author": c.author,
                        "date": c.date,
                        "mention_count": 0
                    }
                docs_involved[doc_key]["mention_count"] += c.text.lower().count(name.lower()) + 1
                
                quotes.append({
                    "chunk_id": c.chunk_id,
                    "title": c.title,
                    "date": c.date,
                    "source_type": c.source_type,
                    "page": c.page_number,
                    "timestamp": c.timestamp_start,
                    "text": c.text
                })

                if c.date:
                    timeline_mentions.append({
                        "date": c.date,
                        "title": c.title,
                        "chunk_id": c.chunk_id
                    })

        total_mentions = sum(d["mention_count"] for d in docs_involved.values())

        return {
            "entity": name,
            "total_mentions": total_mentions,
            "document_count": len(docs_involved),
            "documents": list(docs_involved.values()),
            "excerpts": quotes[:8],
            "timeline": sorted(timeline_mentions, key=lambda x: x["date"])
        }
    except Exception as e:
        logger.error(f"Entity research failed for '{name}': {e}")
        raise HTTPException(status_code=500, detail=f"Failed to research entity: {str(e)}")
