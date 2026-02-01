"""Devpost hackathon scraper."""

import logging
from datetime import datetime
from typing import Optional
import aiohttp
from bs4 import BeautifulSoup

from app.services.scraper.base import BaseScraper
from app.schemas.hackathon import HackathonCreate

logger = logging.getLogger(__name__)


class DevpostScraper(BaseScraper):
    """Scraper for Devpost hackathons."""
    
    platform = "devpost"
    base_url = "https://devpost.com/hackathons"
    
    async def fetch_hackathons(self, pages: int = 3) -> list[HackathonCreate]:
        """
        Fetch hackathons from Devpost.
        
        Args:
            pages: Number of pages to scrape (default 3)
            
        Returns:
            List of hackathons
        """
        hackathons = []
        
        async with aiohttp.ClientSession() as session:
            for page in range(1, pages + 1):
                try:
                    page_hackathons = await self._fetch_page(session, page)
                    hackathons.extend(page_hackathons)
                except Exception as e:
                    logger.error(f"Error fetching Devpost page {page}: {e}")
        
        return hackathons
    
    async def _fetch_page(
        self, session: aiohttp.ClientSession, page: int
    ) -> list[HackathonCreate]:
        """Fetch a single page of hackathons."""
        params = {
            "page": page,
            "status[]": "upcoming",
            "status[]": "open",
        }
        
        async with session.get(self.base_url, params=params) as response:
            if response.status != 200:
                logger.error(f"Devpost returned status {response.status}")
                return []
            
            html = await response.text()
        
        return self._parse_page(html)
    
    def _parse_page(self, html: str) -> list[HackathonCreate]:
        """Parse hackathons from HTML page."""
        soup = BeautifulSoup(html, "lxml")
        hackathons = []
        
        # Find hackathon tiles
        tiles = soup.select(".hackathon-tile")
        
        for tile in tiles:
            try:
                hackathon = self._parse_tile(tile)
                if hackathon:
                    hackathons.append(hackathon)
            except Exception as e:
                logger.error(f"Error parsing Devpost tile: {e}")
        
        return hackathons
    
    def _parse_tile(self, tile) -> Optional[HackathonCreate]:
        """Parse a single hackathon tile."""
        # Get basic info
        title_link = tile.select_one(".content h2 a, .tile-header a")
        if not title_link:
            return None
        
        name = self.clean_text(title_link.get_text())
        url = title_link.get("href", "")
        if url and not url.startswith("http"):
            url = f"https://devpost.com{url}"
        
        # Get description
        tagline = tile.select_one(".tagline, .challenge-tagline")
        description = self.clean_text(tagline.get_text()) if tagline else ""
        
        # Get dates
        date_range = tile.select_one(".date-range, .submission-period")
        start_date = None
        end_date = None
        submission_deadline = None
        
        if date_range:
            date_text = date_range.get_text()
            dates = self._parse_date_range(date_text)
            start_date = dates.get("start")
            end_date = dates.get("end")
            submission_deadline = end_date
        
        # Default deadline to 30 days from now if not found
        if not submission_deadline:
            from datetime import timedelta
            submission_deadline = datetime.utcnow() + timedelta(days=30)
        
        # Get prize
        prize_elem = tile.select_one(".prize-amount, .prize")
        prize_pool = self.clean_text(prize_elem.get_text()) if prize_elem else None
        
        # Get image
        img = tile.select_one("img.hackathon-thumbnail, img.challenge-logo")
        image_url = img.get("src") if img else None
        
        # Get mode
        location_elem = tile.select_one(".location, .challenge-location")
        location = self.clean_text(location_elem.get_text()) if location_elem else None
        mode = self.normalize_mode(location or "online")
        
        # Get tags
        tags = []
        theme_elems = tile.select(".theme, .tag")
        for theme in theme_elems:
            tag = self.clean_text(theme.get_text())
            if tag:
                tags.append(tag)
        
        return HackathonCreate(
            name=name,
            platform=self.platform,
            url=url,
            description=description,
            start_date=start_date,
            end_date=end_date,
            submission_deadline=submission_deadline,
            mode=mode,
            tags=tags or None,
            prize_pool=prize_pool,
            location=location,
            image_url=image_url,
        )
    
    def _parse_date_range(self, text: str) -> dict:
        """Parse date range from Devpost format."""
        import re
        
        # Common formats: "Jan 15 - Feb 15, 2024" or "January 15, 2024 - February 15, 2024"
        result = {"start": None, "end": None}
        
        # Try to find dates
        date_patterns = [
            r"(\w+ \d+(?:, \d{4})?)\s*[-–]\s*(\w+ \d+, \d{4})",
            r"(\d+/\d+/\d+)\s*[-–]\s*(\d+/\d+/\d+)",
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, text)
            if match:
                result["start"] = self.normalize_date(match.group(1))
                result["end"] = self.normalize_date(match.group(2))
                break
        
        return result
