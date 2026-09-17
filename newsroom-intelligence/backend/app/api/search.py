from fastapi import APIRouter, HTTPException
from app.database.models import SearchQuery, SearchResponse
from app.rag.retriever import retriever
from app.rag.reranker import reranker
from app.utils.logging import logger

router = APIRouter(prefix="", tags=["search"])

@router.post("/search", response_model=SearchResponse)
def search_archive(query_req: SearchQuery):
    """
    Performs semantic vector search with FAISS and SQLite metadata lookup.
    """
    try:
        results = retriever.search(
            query=query_req.query,
            top_k=query_req.top_k or 10,
            source_type=query_req.source_type,
            publication=query_req.publication,
            author=query_req.author,
            date_from=query_req.date_from,
            date_to=query_req.date_to
        )

        reranked = reranker.rerank(query_req.query, results)

        return SearchResponse(
            query=query_req.query,
            total_results=len(reranked),
            results=reranked
        )
    except Exception as e:
        logger.error(f"Search failed for query '{query_req.query}': {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")
