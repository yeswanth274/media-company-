import pytest
from app.rag.generator import rag_generator
from app.database.database import init_database

def test_rag_ask_returns_validated_answer():
    init_database()
    question = "What happened during the 2018 Northstar investigation?"
    response = rag_generator.ask(question=question, top_k=5)

    assert response.question == question
    assert response.answer
    assert response.evidence_level in ["strong", "moderate", "limited", "insufficient"]
    assert response.validation_status == "valid"
    assert len(response.citations) > 0
    # Every citation must map to a real chunk
    assert all(c.chunk_id > 0 for c in response.citations)

def test_rag_insufficient_evidence_for_unrelated_query():
    init_database()
    question = "What was the score of the 1994 Martian football championship?"
    response = rag_generator.ask(question=question, top_k=5)

    assert response.evidence_level == "insufficient"
    assert len(response.citations) == 0
    assert len(response.key_evidence) == 0
    assert "insufficient" in response.answer.lower()

def test_rag_what_is_dsa_returns_insufficient_evidence():
    init_database()
    question = "what is dsa"
    response = rag_generator.ask(question=question, top_k=5)

    assert response.evidence_level == "insufficient"
    assert len(response.citations) == 0
    assert len(response.key_evidence) == 0
    assert "insufficient" in response.answer.lower()
