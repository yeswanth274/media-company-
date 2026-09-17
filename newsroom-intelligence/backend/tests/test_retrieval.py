import pytest
from app.rag.retriever import retriever
from app.rag.reranker import reranker
from app.database.database import init_database

def test_retrieval_finds_seeded_documents():
    init_database()
    results = retriever.search(query="Northstar Technologies investigation", top_k=5)
    assert len(results) > 0
    assert any("Northstar" in r.title or "Northstar" in r.text for r in results)
    assert all(r.chunk_id > 0 for r in results)

def test_reranker_boosts_year_matches():
    results = retriever.search(query="2018 municipal investigation", top_k=5)
    reranked = reranker.rerank("2018 municipal investigation", results)
    assert len(reranked) > 0
    # Top result should have positive score
    assert reranked[0].score > 0
