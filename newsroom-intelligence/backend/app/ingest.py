import sys
from app.utils.config import settings
from app.utils.logging import logger
from app.database.database import init_database
from app.ingestion.loader import DocumentLoader

def main():
    init_database()
    target_dir = sys.argv[1] if len(sys.argv) > 1 else settings.DOCUMENTS_DIR
    logger.info(f"Starting Newsroom Intelligence ingestion from: {target_dir}")
    docs = DocumentLoader.ingest_directory(target_dir)
    logger.info(f"Ingestion complete. {len(docs)} documents successfully processed.")

if __name__ == "__main__":
    main()
