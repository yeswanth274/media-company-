import pytest
from app.ingestion.chunker import SemanticChunker
from app.ingestion.extractors import DocumentPage

def test_chunker_basic_splitting():
    chunker = SemanticChunker(target_chunk_size=50, overlap=10)  # small sizes for testing
    pages = [
        DocumentPage(text="Paragraph 1 about Northstar.\n\nParagraph 2 about sensor telemetry in 2018.\n\nParagraph 3 with conclusion.", page_number=1)
    ]
    meta = {"title": "Test Doc", "source_type": "article", "publication": "Metro Daily", "publication_date": "2018-04-12"}
    chunks = chunker.chunk_document(document_id=1, pages=pages, doc_metadata=meta)
    
    assert len(chunks) >= 1
    for c in chunks:
        assert c.document_id == 1
        assert c.page_number == 1
        assert c.text
        assert "Metro Daily" in c.metadata_json

def test_chunker_timestamp_extraction():
    chunker = SemanticChunker(target_chunk_size=100, overlap=10)
    pages = [
        DocumentPage(text="[00:04:12] Elena: We observed sensor drift in late autumn 2017. [00:08:45] Liam: When did the investigation begin?", page_number=1)
    ]
    meta = {"title": "Interview", "source_type": "interview"}
    chunks = chunker.chunk_document(document_id=2, pages=pages, doc_metadata=meta)
    
    assert len(chunks) >= 1
    assert chunks[0].timestamp_start == "00:04:12"
    assert chunks[0].timestamp_end == "00:08:45"
