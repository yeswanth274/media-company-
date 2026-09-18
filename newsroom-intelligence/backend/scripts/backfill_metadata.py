import os
import sys
import sqlite3
from pathlib import Path
from datetime import datetime

# Add backend root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.ingestion.extractors import extract_metadata_from_text, extract_date_from_text
from app.utils.config import settings
from app.utils.logging import logger

def backfill_metadata():
    db_path = settings.DATABASE_PATH
    if not os.path.exists(db_path):
        logger.error(f"Database file not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    docs = cursor.execute("SELECT * FROM documents").fetchall()
    logger.info(f"Checking {len(docs)} documents for metadata enrichment...")

    updated_count = 0
    for doc in docs:
        doc_id = doc["id"]
        current_title = doc["title"] or ""
        current_date = (doc["publication_date"] or "").strip()
        current_author = doc["author"] or ""
        current_pub = doc["publication"] or ""
        created_at = doc["created_at"] or ""
        filename = doc["original_filename"] or ""

        # Fetch chunk text for this document to extract rich metadata
        chunks = cursor.execute(
            "SELECT text FROM chunks WHERE document_id = ? ORDER BY chunk_index ASC LIMIT 5",
            (doc_id,)
        ).fetchall()
        combined_text = "\n\n".join(c["text"] for c in chunks)

        meta = extract_metadata_from_text(combined_text, filename)

        new_title = current_title
        if current_title.lower().startswith("untitled") or current_title.lower() == "verified report" or not current_title:
            if meta.get("title"):
                new_title = meta["title"]

        new_date = current_date
        if not new_date:
            if meta.get("publication_date"):
                new_date = meta["publication_date"]
            elif created_at:
                # Use created_at timestamp date
                try:
                    new_date = created_at.split(" ")[0]
                except Exception:
                    new_date = datetime.now().strftime("%Y-%m-%d")
            else:
                new_date = datetime.now().strftime("%Y-%m-%d")

        new_author = current_author or meta.get("author") or ""
        new_pub = current_pub or meta.get("publication") or "Archive"

        # Update if changed
        if new_title != current_title or new_date != current_date or new_author != current_author or new_pub != current_pub:
            cursor.execute("""
                UPDATE documents
                SET title = ?, publication_date = ?, author = ?, publication = ?, updated_at = datetime('now')
                WHERE id = ?
            """, (new_title, new_date, new_author, new_pub, doc_id))
            updated_count += 1
            logger.info(f"Updated Doc #{doc_id}: Title='{new_title}' | Date='{new_date}' | Author='{new_author}' | Pub='{new_pub}'")

    conn.commit()
    conn.close()
    logger.info(f"Backfill complete! Updated {updated_count} documents.")

if __name__ == "__main__":
    backfill_metadata()
