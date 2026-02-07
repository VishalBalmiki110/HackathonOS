"""
Background job scheduler for periodic hackathon scraping.

Runs every 2 minutes to automatically scrape all platforms  
and add new hackathons to the database.
"""

import logging
import asyncio
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.tasks.ingestion import ingest_hackathons

logger = logging.getLogger(__name__)

# Global scheduler instance
_scheduler = None


def _run_async_task():
    """Wrapper to run async ingestion in sync context."""
    try:
        asyncio.run(ingest_hackathons())
    except Exception as e:
        logger.error(f"Scraping job failed: {e}")


def start_ingestion_scheduler():
    """Start the background scheduler for hackathon ingestion."""
    global _scheduler
    
    if _scheduler is not None:
        logger.warning("Ingestion scheduler already running")
        return
    
    _scheduler = BackgroundScheduler()
    
    # Add job to run every 2 minutes
    _scheduler.add_job(
        _run_async_task,
        trigger=IntervalTrigger(minutes=2),
        id='hackathon_scraper',
        name='Scrape all hackathon platforms',
        replace_existing=True,
        max_instances=1,  # Prevent concurrent runs
    )
    
    _scheduler.start()
    logger.info("🔄 Hackathon scraper started - running every 2 minutes")
    print("🔄 SCHEDULER STARTED: Hackathon scraper running every 2 minutes")


def stop_ingestion_scheduler():
    """Stop the background scheduler."""
    global _scheduler
    
    if _scheduler is not None:
        _scheduler.shutdown()
        _scheduler = None
        logger.info("Ingestion scheduler stopped")
