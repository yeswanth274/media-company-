# Newsroom Intelligence

> **AI-powered archival research with evidence-backed answers.**

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![FAISS](https://img.shields.io/badge/Vector_DB-FAISS-blue?style=flat)](https://github.com/facebookresearch/faiss)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Newsroom Intelligence is a production-grade, evidence-first AI research assistant designed specifically for journalists and investigative teams. It indexes decades of historical articles, interview recordings, official meeting transcripts, court records, and reporter footage logs into a high-performance **SQLite + FAISS** vector database with ONNX-accelerated FastEmbed embeddings.

Unlike general consumer AI bots, Newsroom Intelligence operates on the fundamental principle that **the archival record is the single source of truth, and the LLM is solely a synthesis layer.**

---

## Key Features

- **Evidence-First Hierarchy**: Retrieval > Evidence > Citation > Validation > Generation. No factual claim is made without direct backing from indexed archive sources.
- **Strict Citation Traceability**: All claims feature clickable `[S1]`, `[S2]` citation badges mapping directly to SQLite chunk IDs.
- **Source Inspection with Surrounding Context**: Clicking any citation displays the exact evidence excerpt alongside preceding and succeeding chunks from the original document for complete journalistic context.
- **Archive Discrepancy & Conflict Detection**: Identifies and flags contradictory historical accounts, differing dates, or conflicting executive statements rather than silently reconciling them.
- **Developing Story Workspace**: Assembles full investigative dossiers and structured briefings (Background, Timeline, Key People, Previous Coverage, Important Claims, Conflicting Accounts, Open Questions, Sources) with **PDF & Markdown export**.
- **Chronological Timeline Generator**: Synthesizes verified event sequences with uncertainty preservation (*"Date not established by retrieved archive evidence"*).
- **Multi-Format Ingestion**: Ingests PDF (`PyMuPDF`), DOCX (`python-docx`), HTML (`BeautifulSoup4`), TXT, Markdown, and CSV with metadata extraction and semantic chunking.
- **Pluggable LLM Provider Abstraction**: Switch dynamically between **Groq**, **OpenAI / OpenAI-compatible**, **Google Gemini**, **Ollama**, and **Deterministic Offline Synthesis**.
- **Editorial Light-Theme SaaS UI**: Clean, information-dense, high-trust interface built with React, Vite, and Tailwind CSS.

---

## Architecture Overview

```
                    NEWSROOM ARCHIVE
                           │
                           ▼
                 DOCUMENT INGESTION
            (PDF, DOCX, HTML, TXT, MD, CSV)
                           │
                           ▼
                 TEXT EXTRACTION & CLEANING
                           │
                           ▼
                   SEMANTIC CHUNKING
               (700-1000 tokens, 100-150 overlap)
                           │
                ┌──────────┴──────────┐
                ▼                     ▼
       EMBEDDING GENERATION       SQLITE DB
     (FastEmbed / MiniLM-L6-v2)  (Metadata, Chunks,
                │                Queries, Citations)
                ▼                     │
           FAISS INDEX                │
        (IndexFlatIP Cosine)          │
                │                     │
                ▼                     │
          SEMANTIC SEARCH ◄───────────┘
                │
                ▼
        RELEVANCE RERANKING
                │
                ▼
          CONTEXT BUILDER
                │
                ▼
        LLM SYNTHESIS LAYER
    (Groq / OpenAI / Gemini / Ollama)
                │
                ▼
       CITATION VALIDATION ENGINE
   (Rejects hallucinations & fake IDs)
                │
                ▼
     STRUCTURED EVIDENCE ANSWER
                │
                ▼
       REACT SAAS FRONTEND
```

---

## Directory Structure

```
newsroom-intelligence/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app entry point & CORS
│   │   ├── ingest.py                # CLI ingestion entry point
│   │   │
│   │   ├── api/
│   │   │   ├── documents.py         # Upload, list, get chunks, delete, reindex
│   │   │   ├── search.py            # Faceted semantic & keyword retrieval
│   │   │   ├── ask.py               # Evidence-backed RAG query endpoint
│   │   │   ├── research.py          # Developing story briefings & timelines
│   │   │   └── statistics.py        # Analytics, health checks & settings
│   │   │
│   │   ├── ingestion/
│   │   │   ├── loader.py            # Ingestion manager & validator
│   │   │   ├── extractors.py        # PDF, DOCX, HTML, TXT, CSV extractors
│   │   │   ├── cleaner.py           # Text normalization utility
│   │   │   └── chunker.py           # Semantic token-aware chunker
│   │   │
│   │   ├── embeddings/
│   │   │   └── embedder.py          # FastEmbed (ONNX) & SentenceTransformer fallback
│   │   │
│   │   ├── vectorstore/
│   │   │   ├── faiss_store.py       # FAISS IndexFlatIP store & persistence
│   │   │   └── mapping.py           # FAISS index <-> SQLite chunk_id mapping
│   │   │
│   │   ├── database/
│   │   │   ├── database.py          # SQLite connection (WAL mode, FKs)
│   │   │   ├── models.py            # Pydantic schemas & DB models
│   │   │   └── repositories.py      # Data access layer
│   │   │
│   │   ├── rag/
│   │   │   ├── retriever.py         # Semantic retrieval pipeline
│   │   │   ├── reranker.py          # Lexical & year-aware reranker
│   │   │   ├── prompt.py            # Strict editorial prompts
│   │   │   ├── validator.py         # Citation validation engine
│   │   │   └── generator.py         # End-to-end RAG orchestrator
│   │   │
│   │   ├── llm/
│   │   │   ├── base.py              # LLMProvider abstract base class
│   │   │   ├── groq_provider.py     # Groq API provider
│   │   │   ├── openai_provider.py   # OpenAI / OpenAI-compatible provider
│   │   │   ├── gemini_provider.py   # Google Gemini provider
│   │   │   ├── ollama_provider.py   # Local Ollama provider
│   │   │   ├── fallback_provider.py # Offline deterministic synthesis
│   │   │   └── factory.py           # Provider factory
│   │   │
│   │   └── utils/
│   │       ├── config.py            # Pydantic Settings
│   │       ├── logging.py           # Structured logging
│   │       └── text_utils.py        # Entity & timestamp normalization
│   │
│   ├── scripts/
│   │   ├── init_db.py               # Initialize SQLite schema
│   │   ├── seed_data.py             # Seed 12 sample archive documents
│   │   ├── backfill_metadata.py     # Metadata backfill utility
│   │   └── rebuild_index.py         # Reconstruct FAISS index from DB
│   │
│   ├── tests/
│   │   ├── test_ingestion.py        # Cleaner & extractor tests
│   │   ├── test_chunking.py         # Chunker & metadata tests
│   │   ├── test_retrieval.py        # Semantic retrieval & reranking tests
│   │   ├── test_citations.py        # Citation validator tests
│   │   └── test_rag.py              # End-to-end RAG & hallucination tests
│   │
│   ├── data/
│   │   ├── documents/               # Raw archive document storage
│   │   ├── processed/               # Ingested copies
│   │   ├── faiss/                   # index.faiss & id_map.json
│   │   └── newsroom.db              # SQLite relational database
│   │
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Layout.jsx           # Main layout with persistent sidebar
    │   │   ├── Sidebar.jsx          # Newsroom navigation & live counters
    │   │   ├── Header.jsx           # Editorial header with action triggers
    │   │   ├── SearchBar.jsx        # Question input with suggestion chips
    │   │   ├── AnswerCard.jsx       # Synthesized answer with citations & conflicts
    │   │   ├── CitationBadge.jsx    # Clickable [S#] badges
    │   │   ├── SourceCard.jsx       # Search result source card
    │   │   ├── EvidenceCard.jsx     # Documented fact card
    │   │   ├── SourceDetailModal.jsx# Exact chunk + surrounding context modal
    │   │   ├── Timeline.jsx         # Chronological milestone sequence
    │   │   ├── DocumentCard.jsx     # Document catalogue card
    │   │   ├── UploadDropzone.jsx   # Drag-and-drop uploader with stepper
    │   │   ├── LoadingState.jsx     # Multi-stage editorial loader
    │   │   └── EmptyState.jsx       # Zero-result fallback state
    │   │
    │   ├── pages/
    │   │   ├── Dashboard.jsx        # Analytics, recent queries & quick ask
    │   │   ├── AskArchive.jsx       # Natural-language research assistant
    │   │   ├── SearchArchive.jsx    # Faceted archive search
    │   │   ├── DevelopingStory.jsx  # Dossier workspace with PDF/MD export
    │   │   ├── Documents.jsx        # Catalogue table with chunk inspector
    │   │   ├── UploadDocument.jsx   # Document ingestion & metadata editor
    │   │   ├── TimelinePage.jsx     # Interactive chronology view
    │   │   └── Settings.jsx         # LLM provider & FAISS settings
    │   │
    │   ├── services/
    │   │   └── api.js               # Centralized REST API client
    │   ├── hooks/
    │   │   └── useApi.js            # Async state hook
    │   ├── utils/
    │   │   └── formatters.js        # Date, type & evidence badge helpers
    │   ├── App.jsx                  # Route definitions
    │   ├── main.jsx                 # React root
    │   └── index.css                # Base Tailwind styles & print CSS
    │
    ├── package.json
    ├── vite.config.js
    └── tailwind.config.js
```

---

## Installation & Setup

### Prerequisites
- **Python 3.11+**
- **Node.js v18+ & npm**

### 1. Backend Setup

```bash
cd newsroom-intelligence/backend

# Create virtual environment (optional)
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Initialize database schema
python scripts/init_db.py

# Seed sample archive dataset (12 documents across 2015-2025)
python scripts/seed_data.py

# Launch FastAPI backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 2. Frontend Setup

```bash
cd newsroom-intelligence/frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Environment Variables Configuration

Copy `backend/.env.example` to `backend/.env` to configure your API keys:

```ini
# LLM Provider: 'groq' | 'openai' | 'gemini' | 'ollama' | 'fallback'
LLM_PROVIDER=groq
LLM_MODEL=llama-3.3-70b-versatile

# API Keys (Leave blank to use deterministic offline evidence synthesis)
GROQ_API_KEY=
OPENAI_API_KEY=
GEMINI_API_KEY=
OLLAMA_BASE_URL=http://localhost:11434

# Embedding Model
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# RAG Parameters
TOP_K=10
CHUNK_SIZE=900
CHUNK_OVERLAP=120

# Storage Paths
DATABASE_PATH=data/newsroom.db
FAISS_INDEX_PATH=data/faiss/index.faiss
FAISS_MAPPING_PATH=data/faiss/id_map.json
DOCUMENTS_DIR=data/documents
PROCESSED_DIR=data/processed
```

---

## Running Automated Tests

Run the full pytest suite for chunking, extraction, vector retrieval, citation validation, and RAG synthesis:

```bash
cd newsroom-intelligence/backend
pytest tests/ -v
```

All 11 unit and integration tests verify:
- Semantic chunking boundaries, timestamp extraction, and metadata tagging
- Text and HTML extractors and text cleaner normalization
- Citation validator rejecting hallucinated citation IDs (`[S99]`) and enforcing database grounding
- FAISS vector search and lexical year-boosting reranking
- Full RAG question answering and lack-of-evidence protection

---

## API Endpoints Reference

Interactive OpenAPI Swagger UI is available at `http://localhost:8000/docs`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Operational status, app info & version metadata |
| `GET` | `/health` | System health, FAISS vector count & active provider |
| `GET` | `/statistics` | Archive analytics, chunk counts & recent queries |
| `GET` | `/settings` | Current configuration & vector index state |
| `POST` | `/settings` | Update LLM provider and API keys at runtime |
| `POST` | `/ask` | Evidence-backed question answering with citations & conflicts |
| `POST` | `/search` | Semantic and faceted search across archive chunks |
| `POST` | `/research` | Generate investigative research briefing for stories |
| `GET` | `/stories` | List saved developing stories |
| `GET` | `/stories/{id}` | Retrieve specific developing story dossier |
| `POST` | `/timeline` | Generate verified chronological milestone timeline |
| `GET` | `/entity/research` | Entity mention count, associated docs & excerpts |
| `GET` | `/documents` | List indexed archive documents with filters |
| `POST` | `/documents/upload` | Ingest and index PDF, DOCX, TXT, HTML, CSV file |
| `GET` | `/documents/{id}` | Get document metadata and stats |
| `GET` | `/documents/{id}/chunks` | Get all semantic chunks for a document |
| `DELETE` | `/documents/{id}` | Delete document and rebuild vector index |
| `POST` | `/documents/reindex` | Full reconstruction of FAISS index from SQLite |
| `GET` | `/sources/{chunk_id}` | Get exact chunk + preceding & succeeding context |
| `GET` | `/chunks/{chunk_id}/surrounding` | Get chunk with adjacent surrounding chunks |

---

## Sample Investigative Demo Inquiries

1. **"What happened during the 2018 Northstar investigation?"**
   - Retrieves whistleblower reports, Metro Daily breaking coverage, and inspector statements.
2. **"Which sources disagree about when the investigation began?"**
   - Activates **Conflict Detection Alert**: Highlights discrepancy between Metro Daily (April 2018) and Elena Rostova's internal audit (January 2018).
3. **"What did Alex Morgan say about the investigation?"**
   - Synthesizes 2019 interview denials against subpoenaed 2016 board minutes.
4. **"Build a timeline of the Northstar investigation."**
   - Synthesizes verified chronological sequence from 2015 product launch to 2025 retrospective.
5. **"What evidence do we have about the 2021 settlement?"**
   - Clarifies the $42M total resolution ($28M fine + $14M credits) and resolves news wire discrepancies.
