import os
import shutil
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from app.database.models import DocumentRead, ChunkRead, ChunkSurroundingContext
from app.database.repositories import DocumentRepository, ChunkRepository
from app.ingestion.loader import DocumentLoader, ALLOWED_EXTENSIONS
from app.vectorstore.faiss_store import faiss_store
from app.utils.config import settings
from app.utils.logging import logger

router = APIRouter(prefix="", tags=["documents"])

@router.post("/documents/upload", response_model=DocumentRead)
async def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    source_type: Optional[str] = Form("article"),
    publication: Optional[str] = Form(None),
    author: Optional[str] = Form(None),
    publication_date: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
):
    """
    Uploads and processes a document (PDF, DOCX, TXT, MD, HTML, CSV).
    Extracts text, creates semantic chunks, generates embeddings, and adds to FAISS & SQLite.
    """
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    # Save temp file
    temp_path = Path(settings.DOCUMENTS_DIR) / file.filename
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        doc = DocumentLoader.ingest_file(
            file_path=str(temp_path),
            title=title or file.filename,
            source_type=source_type,
            publication=publication,
            author=author,
            publication_date=publication_date,
            location=location,
            description=description
        )
        return doc
    except Exception as e:
        logger.error(f"Upload failed for {file.filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")
    finally:
        # If temp path is not in processed dir, cleanup
        pass

@router.get("/documents", response_model=List[DocumentRead])
def list_documents(
    source_type: Optional[str] = Query(None),
    publication: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    return DocumentRepository.list_all(
        source_type=source_type,
        publication=publication,
        search_term=search,
        limit=limit,
        offset=offset
    )

@router.get("/documents/{doc_id}", response_model=DocumentRead)
def get_document(doc_id: int):
    doc = DocumentRepository.get_by_id(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@router.get("/documents/{doc_id}/chunks", response_model=List[ChunkRead])
def get_document_chunks(doc_id: int):
    chunks = ChunkRepository.get_by_document_id(doc_id)
    return chunks

@router.delete("/documents/{doc_id}")
def delete_document(doc_id: int):
    doc = DocumentRepository.get_by_id(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    success = DocumentRepository.delete(doc_id)
    if success:
        # Rebuild FAISS index from remaining chunks
        all_chunks = ChunkRepository.get_all_chunks_for_indexing()
        faiss_store.rebuild(all_chunks)
        return {"status": "success", "message": f"Document {doc_id} deleted and index rebuilt."}
    raise HTTPException(status_code=500, detail="Failed to delete document")

@router.get("/sources/{chunk_id}", response_model=ChunkSurroundingContext)
@router.get("/chunks/{chunk_id}/surrounding", response_model=ChunkSurroundingContext)
def get_source_detail(chunk_id: int):
    """
    Returns exact chunk evidence alongside preceding and succeeding chunks for full context.
    """
    ctx = ChunkRepository.get_surrounding_context(chunk_id)
    if not ctx:
        raise HTTPException(status_code=404, detail="Source chunk not found")
    return ctx

@router.post("/documents/reindex")
def reindex_all():
    """
    Rebuilds the entire FAISS index from SQLite chunks.
    """
    all_chunks = ChunkRepository.get_all_chunks_for_indexing()
    faiss_store.rebuild(all_chunks)
    return {
        "status": "success",
        "total_vectors": faiss_store.total_vectors(),
        "total_chunks": len(all_chunks)
    }
