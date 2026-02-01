"""Base scraper class."""

from abc import ABC, abstractmethod
from datetime import datetime
from typing import Optional
import logging

from app.schemas.hackathon import HackathonCreate

logger = logging.getLogger(__name__)


class BaseScraper(ABC):
    """Base class for hackathon platform scrapers."""
    
    platform: str = "unknown"
    
    @abstractmethod
    async def fetch_hackathons(self) -> list[HackathonCreate]:
        """
        Fetch hackathons from the platform.
        
        Returns a list of HackathonCreate schemas.
        """
        pass
    
    def normalize_date(self, date_str: str, formats: list[str] = None) -> Optional[datetime]:
        """Try to parse a date string with multiple formats."""
        if not date_str:
            return None
        
        formats = formats or [
            "%Y-%m-%dT%H:%M:%S.%fZ",
            "%Y-%m-%dT%H:%M:%SZ",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d",
            "%B %d, %Y",
            "%b %d, %Y",
            "%d %B %Y",
            "%d %b %Y",
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(date_str.strip(), fmt)
            except ValueError:
                continue
        
        logger.warning(f"Could not parse date: {date_str}")
        return None
    
    def normalize_mode(self, mode_str: str) -> str:
        """Normalize hackathon mode to standard values."""
        if not mode_str:
            return "online"
        
        mode_lower = mode_str.lower()
        
        if "in-person" in mode_lower or "offline" in mode_lower or "onsite" in mode_lower:
            return "in-person"
        elif "hybrid" in mode_lower:
            return "hybrid"
        else:
            return "online"
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text content."""
        if not text:
            return ""
        return " ".join(text.split()).strip()
