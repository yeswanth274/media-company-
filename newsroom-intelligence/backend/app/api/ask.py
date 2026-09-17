from fastapi import APIRouter, HTTPException
from app.database.models import AskRequest, AskResponse
from app.rag.generator import rag_generator
from app.utils.logging import logger

router = APIRouter(prefix="", tags=["ask"])

@router.post("/ask", response_model=AskResponse)
def ask_archive(req: AskRequest):
    """
    RAG evidence-backed question answering with strict citation validation and conflict detection.
    """
    if not req.question or not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:
        response = rag_generator.ask(
            question=req.question.strip(),
            top_k=req.top_k or 10,
            filters=req.filters
        )
        return response
    except Exception as e:
        logger.error(f"Error processing question '{req.question}': {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate evidence-backed answer: {str(e)}")
