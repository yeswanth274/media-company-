import json
import sqlite3
from typing import List, Optional, Dict, Any, Tuple
from app.database.database import db_session, get_db_connection
from app.database.models import (
    DocumentCreate, DocumentRead,
    ChunkCreate, ChunkRead, ChunkSurroundingContext,
    CitationItem, StoryCreate, StoryRead, NewsroomStats
)
from app.utils.logging import logger

class DocumentRepository:
    @staticmethod
    def create(doc: DocumentCreate) -> int:
        with db_session() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO documents (
                    title, source_type, publication, author, publication_date,
                    location, description, original_filename, original_path
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                doc.title, doc.source_type, doc.publication, doc.author,
                doc.publication_date, doc.location, doc.description,
                doc.original_filename, doc.original_path
            ))
            return cursor.lastrowid

    @staticmethod
    def get_by_id(doc_id: int) -> Optional[DocumentRead]:
        with db_session() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT d.*, COUNT(c.id) as chunk_count
                FROM documents d
                LEFT JOIN chunks c ON d.id = c.document_id
                WHERE d.id = ?
                GROUP BY d.id
            """, (doc_id,))
            row = cursor.fetchone()
            if not row:
                return None
            return DocumentRead(**dict(row))

    @staticmethod
    def list_all(
        source_type: Optional[str] = None,
        publication: Optional[str] = None,
        search_term: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[DocumentRead]:
        with db_session() as conn:
            cursor = conn.cursor()
            query = """
                SELECT d.*, COUNT(c.id) as chunk_count
                FROM documents d
                LEFT JOIN chunks c ON d.id = c.document_id
                WHERE 1=1
            """
            params: List[Any] = []

            if source_type:
                query += " AND d.source_type = ?"
                params.append(source_type)
            if publication:
                query += " AND d.publication = ?"
                params.append(publication)
            if search_term:
                query += " AND (d.title LIKE ? OR d.author LIKE ? OR d.description LIKE ?)"
                like_str = f"%{search_term}%"
                params.extend([like_str, like_str, like_str])

            query += " GROUP BY d.id ORDER BY d.publication_date DESC, d.created_at DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])

            cursor.execute(query, params)
            rows = cursor.fetchall()
            return [DocumentRead(**dict(r)) for r in rows]

    @staticmethod
    def delete(doc_id: int) -> bool:
        with db_session() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
            return cursor.rowcount > 0

    @staticmethod
    def count() -> int:
        with db_session() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM documents")
            return cursor.fetchone()[0]


class ChunkRepository:
    @staticmethod
    def create_batch(chunks: List[ChunkCreate]) -> List[int]:
        ids = []
        with db_session() as conn:
            cursor = conn.cursor()
            for chunk in chunks:
                cursor.execute("""
                    INSERT INTO chunks (
                        document_id, chunk_index, text, page_number,
                        timestamp_start, timestamp_end, start_position,
                        end_position, metadata_json
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    chunk.document_id, chunk.chunk_index, chunk.text,
                    chunk.page_number, chunk.timestamp_start, chunk.timestamp_end,
                    chunk.start_position, chunk.end_position, chunk.metadata_json
                ))
                ids.append(cursor.lastrowid)
        return ids

    @staticmethod
    def get_by_id(chunk_id: int) -> Optional[ChunkRead]:
        with db_session() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT c.*, d.title as document_title, d.publication, d.author,
                       d.publication_date, d.source_type
                FROM chunks c
                JOIN documents d ON c.document_id = d.id
                WHERE c.id = ?
            """, (chunk_id,))
            row = cursor.fetchone()
            if not row:
                return None
            return ChunkRead(**dict(row))

    @staticmethod
    def get_by_ids(chunk_ids: List[int]) -> List[ChunkRead]:
        if not chunk_ids:
            return []
        with db_session() as conn:
            cursor = conn.cursor()
            placeholders = ",".join("?" for _ in chunk_ids)
            query = f"""
                SELECT c.*, d.title as document_title, d.publication, d.author,
                       d.publication_date, d.source_type
                FROM chunks c
                JOIN documents d ON c.document_id = d.id
                WHERE c.id IN ({placeholders})
            """
            cursor.execute(query, chunk_ids)
            rows = cursor.fetchall()
            results = {r["id"]: ChunkRead(**dict(r)) for r in rows}
            # Maintain input order
            return [results[cid] for cid in chunk_ids if cid in results]

    @staticmethod
    def get_by_document_id(doc_id: int) -> List[ChunkRead]:
        with db_session() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT c.*, d.title as document_title, d.publication, d.author,
                       d.publication_date, d.source_type
                FROM chunks c
                JOIN documents d ON c.document_id = d.id
                WHERE c.document_id = ?
                ORDER BY c.chunk_index ASC
            """, (doc_id,))
            rows = cursor.fetchall()
            return [ChunkRead(**dict(r)) for r in rows]

    @staticmethod
    def get_surrounding_context(chunk_id: int) -> Optional[ChunkSurroundingContext]:
        current = ChunkRepository.get_by_id(chunk_id)
        if not current:
            return None

        document = DocumentRepository.get_by_id(current.document_id)

        with db_session() as conn:
            cursor = conn.cursor()
            # Previous chunk
            cursor.execute("""
                SELECT c.*, d.title as document_title, d.publication, d.author,
                       d.publication_date, d.source_type
                FROM chunks c
                JOIN documents d ON c.document_id = d.id
                WHERE c.document_id = ? AND c.chunk_index = ?
            """, (current.document_id, current.chunk_index - 1))
            prev_row = cursor.fetchone()
            prev_chunk = ChunkRead(**dict(prev_row)) if prev_row else None

            # Next chunk
            cursor.execute("""
                SELECT c.*, d.title as document_title, d.publication, d.author,
                       d.publication_date, d.source_type
                FROM chunks c
                JOIN documents d ON c.document_id = d.id
                WHERE c.document_id = ? AND c.chunk_index = ?
            """, (current.document_id, current.chunk_index + 1))
            next_row = cursor.fetchone()
            next_chunk = ChunkRead(**dict(next_row)) if next_row else None

        return ChunkSurroundingContext(
            current_chunk=current,
            previous_chunk=prev_chunk,
            next_chunk=next_chunk,
            document=document
        )

    @staticmethod
    def get_all_chunks_for_indexing() -> List[Dict[str, Any]]:
        with db_session() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT c.id as chunk_id, c.text, c.document_id, c.chunk_index,
                       d.title, d.source_type, d.publication, d.author, d.publication_date
                FROM chunks c
                JOIN documents d ON c.document_id = d.id
                ORDER BY c.id ASC
            """)
            return [dict(r) for r in cursor.fetchall()]

    @staticmethod
    def count() -> int:
        with db_session() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM chunks")
            return cursor.fetchone()[0]


class QueryRepository:
    @staticmethod
    def create(question: str, answer: str, evidence_level: str) -> int:
        with db_session() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO queries (question, answer, evidence_level)
                VALUES (?, ?, ?)
            """, (question, answer, evidence_level))
            return cursor.lastrowid

    @staticmethod
    def add_citations(query_id: int, citations: List[Tuple[int, int, float]]):
        # citations is list of (chunk_id, citation_number, relevance_score)
        with db_session() as conn:
            cursor = conn.cursor()
            for chunk_id, num, score in citations:
                cursor.execute("""
                    INSERT INTO citations (query_id, chunk_id, citation_number, relevance_score)
                    VALUES (?, ?, ?, ?)
                """, (query_id, chunk_id, num, score))

    @staticmethod
    def get_recent(limit: int = 10) -> List[Dict[str, Any]]:
        with db_session() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, question, answer, evidence_level, created_at
                FROM queries
                ORDER BY created_at DESC
                LIMIT ?
            """, (limit,))
            return [dict(r) for r in cursor.fetchall()]

    @staticmethod
    def count() -> int:
        with db_session() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM queries")
            return cursor.fetchone()[0]


class StoryRepository:
    @staticmethod
    def create(story: StoryCreate, briefing_json: Optional[str] = None) -> int:
        with db_session() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO stories (title, research_question, tags, briefing_json)
                VALUES (?, ?, ?, ?)
            """, (story.title, story.research_question, story.tags, briefing_json))
            return cursor.lastrowid

    @staticmethod
    def get_by_id(story_id: int) -> Optional[StoryRead]:
        with db_session() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM stories WHERE id = ?", (story_id,))
            row = cursor.fetchone()
            if not row:
                return None
            return StoryRead(**dict(row))

    @staticmethod
    def update_briefing(story_id: int, briefing_json: str) -> bool:
        with db_session() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE stories
                SET briefing_json = ?, updated_at = datetime('now')
                WHERE id = ?
            """, (briefing_json, story_id))
            return cursor.rowcount > 0

    @staticmethod
    def list_all(limit: int = 20) -> List[StoryRead]:
        with db_session() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM stories ORDER BY updated_at DESC LIMIT ?", (limit,))
            return [StoryRead(**dict(r)) for r in cursor.fetchall()]

    @staticmethod
    def count() -> int:
        with db_session() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM stories")
            return cursor.fetchone()[0]


class StatisticsRepository:
    @staticmethod
    def get_stats() -> NewsroomStats:
        docs_count = DocumentRepository.count()
        chunks_count = ChunkRepository.count()
        queries_count = QueryRepository.count()
        stories_count = StoryRepository.count()

        with db_session() as conn:
            cursor = conn.cursor()
            # Distinct publication / source entities
            cursor.execute("SELECT COUNT(DISTINCT publication) FROM documents WHERE publication IS NOT NULL")
            sources_count = cursor.fetchone()[0] or 0
            if sources_count == 0:
                sources_count = docs_count

        recent_docs = DocumentRepository.list_all(limit=5)
        recent_queries = QueryRepository.get_recent(limit=5)

        return NewsroomStats(
            documents_count=docs_count,
            chunks_count=chunks_count,
            sources_count=sources_count,
            queries_count=queries_count,
            stories_count=stories_count,
            recent_documents=recent_docs,
            recent_queries=recent_queries,
            system_status="online"
        )
