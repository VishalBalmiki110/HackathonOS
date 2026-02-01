"""MLH hackathon scraper."""

import logging
from datetime import datetime
from typing import Optional
import aiohttp
from bs4 import BeautifulSoup

from app.services.scraper.base import BaseScraper
from app.schemas.hackathon import HackathonCreate

logger = logging.getLogger(__name__)


class MLHScraper(BaseScraper):
    """Scraper for Major League Hacking (MLH) hackathons."""
    
    platform = "mlh"
    base_url = "https://mlh.io/seasons/2025/events"
    
    async def fetch_hackathons(self) -> list[HackathonCreate]:
        """
        Fetch hackathons from MLH.
        
        Returns:
            List of hackathons
        """
        hackathons = []
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(self.base_url) as response:
                    if response.status != 200:
                        logger.error(f"MLH returned status {response.status}")
                        return []
                    
                    html = await response.text()
                
                hackathons = self._parse_page(html)
            except Exception as e:
                logger.error(f"Error fetching MLH hackathons: {e}")
        
        return hackathons
    
    def _parse_page(self, html: str) -> list[HackathonCreate]:
        """Parse hackathons from MLH page."""
        soup = BeautifulSoup(html, "lxml")
        hackathons = []
        
        # Find event rows
        events = soup.select(".event, .event-wrapper, [class*='event']")
        
        for event in events:
            try:
                hackathon = self._parse_event(event)
                if hackathon:
                    hackathons.append(hackathon)
            except Exception as e:
                logger.error(f"Error parsing MLH event: {e}")
        
        return hackathons
    
    def _parse_event(self, event) -> Optional[HackathonCreate]:
        """Parse a single MLH event."""
        # Get name and URL
        name_elem = event.select_one("h3, .event-name, .event-title")
        if not name_elem:
            return None
        
        name = self.clean_text(name_elem.get_text())
        
        # Get URL from link
        link = event.select_one("a[href*='hackathon'], a.event-link")
        url = link.get("href", "") if link else ""
        if url and not url.startswith("http"):
            url = f"https://mlh.io{url}"
        
        # Get dates
        date_elem = event.select_one(".event-date, .dates")
        start_date = None
        end_date = None
        
        if date_elem:
            date_text = date_elem.get_text()
            dates = self._parse_mlh_dates(date_text)
            start_date = dates.get("start")
            end_date = dates.get("end")
        
        # MLH hackathons typically end on Sunday, deadline is same as end
        submission_deadline = end_date
        if not submission_deadline:
            from datetime import timedelta
            submission_deadline = datetime.utcnow() + timedelta(days=30)
        
        # Get location
        location_elem = event.select_one(".event-location, .location")
        location = self.clean_text(location_elem.get_text()) if location_elem else None
        
        # Determine mode from location
        mode = "online"
        if location:
            if "digital" in location.lower() or "virtual" in location.lower():
                mode = "online"
            elif "hybrid" in location.lower():
                mode = "hybrid"
            else:
                mode = "in-person"
        
        # Get image
        img = event.select_one("img.event-logo, img")
        image_url = img.get("src") if img else None
        if image_url and not image_url.startswith("http"):
            image_url = f"https://mlh.io{image_url}"
        
        # MLH specific tags
        tags = ["mlh", "official"]
        
        return HackathonCreate(
            name=name,
            platform=self.platform,
            url=url or f"https://mlh.io/seasons/2025/events",
            description=f"MLH Official Hackathon: {name}",
            start_date=start_date,
            end_date=end_date,
            submission_deadline=submission_deadline,
            mode=mode,
            tags=tags,
            location=location,
            image_url=image_url,
        )
    
    def _parse_mlh_dates(self, text: str) -> dict:
        """Parse date from MLH format."""
        import re
        
        result = {"start": None, "end": None}
        
        # MLH format: "Feb 14th - 16th, 2025" or "February 14-16, 2025"
        patterns = [
            r"(\w+ \d+)(?:st|nd|rd|th)?\s*[-–]\s*(\d+)(?:st|nd|rd|th)?,?\s*(\d{4})",
            r"(\w+ \d+)\s*[-–]\s*(\w+ \d+),?\s*(\d{4})",
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                groups = match.groups()
                if len(groups) == 3:
                    # Same month range
                    start_str = f"{groups[0]}, {groups[2]}"
                    result["start"] = self.normalize_date(start_str)
                    
                    # Extract month from start
                    month_match = re.match(r"(\w+)", groups[0])
                    if month_match:
                        end_str = f"{month_match.group(1)} {groups[1]}, {groups[2]}"
                        result["end"] = self.normalize_date(end_str)
                break
        
        return result
