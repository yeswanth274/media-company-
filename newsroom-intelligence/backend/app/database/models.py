from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

# Document Models
class DocumentBase(BaseModel):
    title: str
    source_type: Optional[str] = "article"  # article, interview, transcript, footage_note, court_filing, memo
    publication: Optional[str] = None
    author: Optional[str] = None
    publication_date: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None

class DocumentCreate(DocumentBase):
    original_filename: Optional[str] = None
    original_path: Optional[str] = None

class DocumentRead(DocumentBase):
    id: int
    original_filename: Optional[str] = None
    original_path: Optional[str] = None
    chunk_count: Optional[int] = 0
    created_at: str
    updated_at: str

# Chunk Models
class ChunkBase(BaseModel):
    document_id: int
    chunk_index: int
    text: str
    page_number: Optional[int] = None
    timestamp_start: Optional[str] = None
    timestamp_end: Optional[str] = None
    start_position: Optional[int] = None
    end_position: Optional[int] = None
    metadata_json: Optional[str] = None

class ChunkCreate(ChunkBase):
    pass

class ChunkRead(ChunkBase):
    id: int
    created_at: str
    document_title: Optional[str] = None
    publication: Optional[str] = None
    author: Optional[str] = None
    publication_date: Optional[str] = None
    source_type: Optional[str] = None

# Surrounding Context for Source Modal
class ChunkSurroundingContext(BaseModel):
    current_chunk: ChunkRead
    previous_chunk: Optional[ChunkRead] = None
    next_chunk: Optional[ChunkRead] = None
    document: Optional[DocumentRead] = None

# Retrieval & Search Models
class SearchQuery(BaseModel):
    query: str
    top_k: Optional[int] = 10
    source_type: Optional[str] = None
    publication: Optional[str] = None
    author: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None

class SearchResultChunk(BaseModel):
    chunk_id: int
    score: float
    text: str
    document_id: int
    title: str
    author: Optional[str] = None
    publication: Optional[str] = None
    date: Optional[str] = None
    source_type: Optional[str] = None
    page_number: Optional[int] = None
    timestamp_start: Optional[str] = None
    timestamp_end: Optional[str] = None
    location: Optional[str] = None

class SearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[SearchResultChunk]

# Ask & Citation Models
class AskRequest(BaseModel):
    question: str
    top_k: Optional[int] = 10
    filters: Optional[Dict[str, Any]] = None

class CitationItem(BaseModel):
    id: str  # S1, S2, etc.
    chunk_id: int
    title: Optional[str] = None
    author: Optional[str] = None
    publication: Optional[str] = None
    date: Optional[str] = None
    source_type: Optional[str] = None
    page: Optional[int] = None
    timestamp: Optional[str] = None
    excerpt: Optional[str] = None
    relevance_score: Optional[float] = None

class KeyEvidenceItem(BaseModel):
    text: str
    citations: List[str]

class ConflictItem(BaseModel):
    issue: str
    description: str
    conflicting_sources: List[str]

class AskResponse(BaseModel):
    query_id: Optional[int] = None
    question: str
    answer: str
    evidence_level: str  # strong, moderate, limited, insufficient
    key_evidence: List[KeyEvidenceItem] = []
    conflicts: List[ConflictItem] = []
    citations: List[CitationItem] = []
    retrieved_count: int = 0
    validation_status: str = "valid"

# Developing Story & Briefing Models
class StoryCreate(BaseModel):
    title: str
    research_question: str
    tags: Optional[str] = ""

class StoryRead(BaseModel):
    id: int
    title: str
    research_question: str
    tags: Optional[str] = ""
    briefing_json: Optional[str] = None
    created_at: str
    updated_at: str

class TimelineEvent(BaseModel):
    date: str
    event: str
    source_ids: List[str]
    citations: List[CitationItem] = []
    conflict_note: Optional[str] = None

class ResearchBriefing(BaseModel):
    title: str
    research_question: str
    background: str
    key_developments: List[str]
    timeline: List[TimelineEvent]
    key_people: List[Dict[str, Any]]
    previous_coverage: List[Dict[str, Any]]
    important_claims: List[Dict[str, Any]]
    conflicting_accounts: List[ConflictItem]
    open_questions: List[str]
    sources: List[CitationItem]
    evidence_level: str = "strong"

# Statistics Models
class NewsroomStats(BaseModel):
    documents_count: int
    chunks_count: int
    sources_count: int
    queries_count: int
    stories_count: int
    recent_documents: List[DocumentRead]
    recent_queries: List[Dict[str, Any]]
    system_status: str = "online"
