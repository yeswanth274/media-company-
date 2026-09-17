import pytest
from app.rag.validator import CitationValidator
from app.database.models import SearchResultChunk
from app.database.repositories import DocumentRepository, ChunkRepository
from app.database.models import DocumentCreate, ChunkCreate
from app.database.database import init_database

def test_citation_validator_rejects_hallucinations():
    init_database()
    
    # Create a real doc and chunk in sqlite
    doc_id = DocumentRepository.create(DocumentCreate(title="Verified Report", source_type="article"))
    chunk_ids = ChunkRepository.create_batch([
        ChunkCreate(document_id=doc_id, chunk_index=0, text="Verified evidence text regarding 2018 probe.")
    ])
    real_chunk_id = chunk_ids[0]

    retrieved = [
        SearchResultChunk(
            chunk_id=real_chunk_id,
            score=0.92,
            text="Verified evidence text regarding 2018 probe.",
            document_id=doc_id,
            title="Verified Report"
        )
    ]
    citation_map = {"S1": retrieved[0]}

    raw_llm_json = {
        "answer": "The probe was verified in 2018 [S1], but another fake claim exists [S99].",
        "evidence_level": "strong",
        "citations": [
            {"id": "S1", "chunk_id": real_chunk_id},
            {"id": "S99", "chunk_id": 99999}  # Fake hallucinated citation
        ],
        "key_evidence": [
            {"text": "Verified evidence text", "citations": ["S1", "S99"]}
        ],
        "conflicts": []
    }

    validated = CitationValidator.validate_and_enrich(raw_llm_json, retrieved, citation_map)

    # Assert S99 is stripped from answer and citations list
    assert "[S1]" in validated["answer"]
    assert "[S99]" not in validated["answer"]
    assert len(validated["citations"]) == 1
    assert validated["citations"][0].id == "S1"
    assert validated["citations"][0].chunk_id == real_chunk_id
