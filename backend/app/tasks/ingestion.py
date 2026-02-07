"""
Hackathon ingestion tasks.

This module contains background jobs for scraping and 
ingesting hackathons from various platforms.
"""

import logging
import asyncio
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.config import get_settings
from app.models.hackathon import Hackathon
from app.services.scraper import DevpostScraper, DoraHacksScraper, MLHScraper, UnstopScraper

logger = logging.getLogger(__name__)
settings = get_settings()

# Async database setup for background tasks
async_database_url = settings.database_url.replace(
    "postgresql://", "postgresql+asyncpg://"
)
async_engine = create_async_engine(async_database_url, echo=False)
AsyncSessionLocal = sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def ingest_hackathons(db: AsyncSession = None):
    """
    Run hackathon ingestion from all scrapers.
    
    This function fetches hackathons from all platforms,
    deduplicates them, and stores new ones in the database.
    """
    if db is None:
        async with AsyncSessionLocal() as session:
            await _ingest_all(session)
    else:
        await _ingest_all(db)


async def _ingest_all(db: AsyncSession):
    """Run ingestion with the provided database session."""
    scrapers = [
        DevpostScraper(),
        DoraHacksScraper(),
        MLHScraper(),
        UnstopScraper(),
    ]
    
    total_added = 0
    total_updated = 0
    
    for scraper in scrapers:
        try:
            logger.info(f"Fetching hackathons from {scraper.platform}")
            hackathons = await scraper.fetch_hackathons()
            
            for hackathon_data in hackathons:
                added, updated = await _upsert_hackathon(db, hackathon_data)
                total_added += added
                total_updated += updated
            
            logger.info(
                f"Processed {len(hackathons)} hackathons from {scraper.platform}"
            )
        except Exception as e:
            logger.error(f"Error ingesting from {scraper.platform}: {e}")
    
    await db.commit()
    logger.info(f"Ingestion complete. Added: {total_added}, Updated: {total_updated}")


async def _upsert_hackathon(db: AsyncSession, hackathon_data) -> tuple[int, int]:
    """
    Insert or update a hackathon in the database.
    
    Returns (added_count, updated_count)
    """
    # Check if hackathon exists (by URL and platform)
    result = await db.execute(
        select(Hackathon).where(
            Hackathon.url == hackathon_data.url,
            Hackathon.platform == hackathon_data.platform,
        )
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        # Update existing hackathon
        for key, value in hackathon_data.model_dump().items():
            if value is not None:
                setattr(existing, key, value)
        existing.updated_at = datetime.utcnow()
        return (0, 1)
    else:
        # Create new hackathon
        new_hackathon = Hackathon(**hackathon_data.model_dump())
        db.add(new_hackathon)
        return (1, 0)


def run_ingestion():
    """Run ingestion as a standalone script."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )
    
    logger.info("Starting hackathon ingestion...")
    asyncio.run(ingest_hackathons())
    logger.info("Ingestion finished.")


if __name__ == "__main__":
    run_ingestion()
