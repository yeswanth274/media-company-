import os
import shutil
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, List
from app.utils.config import settings
from app.utils.logging import logger
from app.database.models import DocumentCreate, DocumentRead
from app.database.repositories import DocumentRepository, ChunkRepository
from app.ingestion.extractors import get_extractor_for_file
from app.ingestion.chunker import chunker
from app.vectorstore.faiss_store import faiss_store

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt", ".md", ".html", ".htm", ".csv", ".json"}
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50MB

class DocumentLoader:
    @staticmethod
    def validate_file(file_path: str) -> None:
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        if path.suffix.lower() not in ALLOWED_EXTENSIONS:
            raise ValueError(f"Unsupported file type: {path.suffix}. Supported types: {', '.join(sorted(ALLOWED_EXTENSIONS))}")
        if path.stat().st_size > MAX_FILE_SIZE_BYTES:
            raise ValueError(f"File exceeds maximum allowed size of {MAX_FILE_SIZE_BYTES // (1024*1024)}MB.")

    @staticmethod
    def ingest_file(
        file_path: str,
        title: Optional[str] = None,
        source_type: Optional[str] = None,
        publication: Optional[str] = None,
        author: Optional[str] = None,
        publication_date: Optional[str] = None,
        location: Optional[str] = None,
        description: Optional[str] = None,
    ) -> DocumentRead:
        DocumentLoader.validate_file(file_path)
        path = Path(file_path)

        # 1. Extraction
        extractor = get_extractor_for_file(file_path)
        extracted = extractor.extract(file_path)

        # Copy original file to processed storage
        processed_path = Path(settings.PROCESSED_DIR) / f"{path.stem}_{path.name}"
        try:
            shutil.copy2(file_path, processed_path)
            stored_path = str(processed_path)
        except Exception:
            stored_path = str(file_path)

        # Intelligent metadata resolution
        doc_title = title
        # If title is blank, generic, or just the filename, use extracted headline if available
        if not doc_title or doc_title.lower().startswith("untitled") or doc_title == path.name:
            doc_title = extracted.metadata.get("title") or title or path.stem.replace("_", " ").replace("-", " ").title()

        doc_author = author or extracted.metadata.get("author") or ""
        doc_publication = publication or extracted.metadata.get("publication") or "Archive"

        # Date hierarchy: Explicit user input -> Extracted publication date from text -> Extracted metadata date -> File mod date -> Today
        doc_date = (publication_date or "").strip()
        if not doc_date:
            doc_date = extracted.metadata.get("publication_date") or extracted.metadata.get("creation_date")
        if not doc_date:
            try:
                doc_date = datetime.fromtimestamp(path.stat().st_mtime).strftime("%Y-%m-%d")
            except Exception:
                doc_date = datetime.now().strftime("%Y-%m-%d")

        doc_location = location or extracted.metadata.get("location")

        doc_source_type = source_type or "article"
        if "interview" in doc_title.lower() or "interview" in path.name.lower():
            doc_source_type = "interview"
        elif "transcript" in doc_title.lower() or "transcript" in path.name.lower():
            doc_source_type = "transcript"
        elif "footage" in doc_title.lower() or "notes" in path.name.lower() or "tape" in path.name.lower():
            doc_source_type = "footage_note"

        doc_create = DocumentCreate(
            title=doc_title,
            source_type=doc_source_type,
            publication=doc_publication,
            author=doc_author,
            publication_date=doc_date,
            location=doc_location,
            description=description,
            original_filename=path.name,
            original_path=stored_path
        )

        # 2. Insert into SQLite documents table
        doc_id = DocumentRepository.create(doc_create)
        logger.info(f"Ingested document record with ID {doc_id}: '{doc_title}' (Date: {doc_date})")

        # 3. Semantic Chunking
        doc_meta_dict = doc_create.model_dump()
        chunks_to_create = chunker.chunk_document(doc_id, extracted.pages, doc_meta_dict)

        if not chunks_to_create:
            # Create at least one fallback chunk if text was non-empty
            if extracted.raw_text.strip():
                from app.database.models import ChunkCreate
                chunks_to_create = [
                    ChunkCreate(
                        document_id=doc_id,
                        chunk_index=0,
                        text=extracted.raw_text.strip(),
                        page_number=1,
                        metadata_json=None
                    )
                ]

        # 4. Insert chunks into SQLite
        chunk_ids = ChunkRepository.create_batch(chunks_to_create)
        logger.info(f"Created {len(chunk_ids)} chunks in SQLite for document ID {doc_id}.")

        # 5. Embed & Insert into FAISS
        chunk_texts = [c.text for c in chunks_to_create]
        if chunk_ids and chunk_texts:
            faiss_store.add_vectors(chunk_ids, chunk_texts)

        doc_read = DocumentRepository.get_by_id(doc_id)
        return doc_read

    @staticmethod
    def ingest_directory(directory_path: str) -> List[DocumentRead]:
        dir_path = Path(directory_path)
        if not dir_path.exists() or not dir_path.is_dir():
            raise FileNotFoundError(f"Directory not found: {directory_path}")

        ingested = []
        for file_path in dir_path.iterdir():
            if file_path.is_file() and file_path.suffix.lower() in ALLOWED_EXTENSIONS:
                try:
                    logger.info(f"Ingesting file: {file_path.name}")
                    doc = DocumentLoader.ingest_file(str(file_path))
                    ingested.append(doc)
                except Exception as e:
                    logger.error(f"Error ingesting {file_path.name}: {e}")
        return ingested

if __name__ == "__main__":
    import sys
    from app.database.database import init_database
    init_database()
    target_dir = sys.argv[1] if len(sys.argv) > 1 else settings.DOCUMENTS_DIR
    logger.info(f"Running batch ingestion from: {target_dir}")
    DocumentLoader.ingest_directory(target_dir)
