import sys
from pathlib import Path

# Add backend root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database.database import init_database
from app.utils.logging import logger

if __name__ == "__main__":
    logger.info("Initializing SQLite database...")
    init_database()
    logger.info("Database initialization complete.")
