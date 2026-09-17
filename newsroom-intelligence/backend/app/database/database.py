import sqlite3
import os
from contextlib import contextmanager
from app.utils.config import settings
from app.utils.logging import logger

def get_db_connection() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(settings.DATABASE_PATH), exist_ok=True)
    conn = sqlite3.connect(settings.DATABASE_PATH, timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    return conn

@contextmanager
def db_session():
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"Database transaction failed: {e}")
        raise
    finally:
        conn.close()

def init_database():
    """Initializes SQLite database tables and indexes."""
    with db_session() as conn:
        cursor = conn.cursor()
        
        # TABLE: documents
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            source_type TEXT,
            publication TEXT,
            author TEXT,
            publication_date TEXT,
            location TEXT,
            description TEXT,
            original_filename TEXT,
            original_path TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );
        """)

        # TABLE: chunks
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS chunks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            document_id INTEGER NOT NULL,
            chunk_index INTEGER NOT NULL,
            text TEXT NOT NULL,
            page_number INTEGER,
            timestamp_start TEXT,
            timestamp_end TEXT,
            start_position INTEGER,
            end_position INTEGER,
            metadata_json TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
        );
        """)

        # TABLE: queries
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS queries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question TEXT NOT NULL,
            answer TEXT,
            evidence_level TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );
        """)

        # TABLE: citations
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS citations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            query_id INTEGER NOT NULL,
            chunk_id INTEGER NOT NULL,
            citation_number INTEGER,
            relevance_score REAL,
            FOREIGN KEY (query_id) REFERENCES queries (id) ON DELETE CASCADE,
            FOREIGN KEY (chunk_id) REFERENCES chunks (id) ON DELETE CASCADE
        );
        """)

        # TABLE: stories (Developing Story Workspace)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS stories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            research_question TEXT,
            tags TEXT,
            briefing_json TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );
        """)

        # Indexes for fast lookup
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks(document_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_chunks_chunk_index ON chunks(document_id, chunk_index);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_documents_date ON documents(publication_date);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_documents_source_type ON documents(source_type);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_documents_publication ON documents(publication);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_citations_query ON citations(query_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_citations_chunk ON citations(chunk_id);")

        logger.info("Database schema initialized successfully.")
