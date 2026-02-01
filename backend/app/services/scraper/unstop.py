"""Unstop hackathon scraper."""

import logging
from datetime import datetime
from typing import Optional
import aiohttp

from app.services.scraper.base import BaseScraper
from app.schemas.hackathon import HackathonCreate

logger = logging.getLogger(__name__)


class UnstopScraper(BaseScraper):
    """Scraper for Unstop (formerly Dare2Compete) hackathons."""
    
    platform = "unstop"
    api_url = "https://unstop.com/api/public/opportunity/search-result"
    
    async def fetch_hackathons(self, pages: int = 3) -> list[HackathonCreate]:
        """
        Fetch hackathons from Unstop API.
        
        Args:
            pages: Number of pages to fetch
            
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
                    logger.error(f"Error fetching Unstop page {page}: {e}")
        
        return hackathons
    
    async def _fetch_page(
        self, session: aiohttp.ClientSession, page: int
    ) -> list[HackathonCreate]:
        """Fetch a single page from Unstop API."""
        params = {
            "page": page,
            "per_page": 20,
            "oppstatus": "open",
            "type": "hackathons",
        }
        
        headers = {
            "Accept": "application/json",
            "User-Agent": "HackathonOS/1.0",
        }
        
        async with session.get(self.api_url, params=params, headers=headers) as response:
            if response.status != 200:
                logger.error(f"Unstop API returned status {response.status}")
                return []
            
            data = await response.json()
        
        return self._parse_response(data)
    
    def _parse_response(self, data: dict) -> list[HackathonCreate]:
        """Parse hackathons from API response."""
        hackathons = []
        
        opportunities = data.get("data", {}).get("data", [])
        
        for opp in opportunities:
            try:
                hackathon = self._parse_opportunity(opp)
                if hackathon:
                    hackathons.append(hackathon)
            except Exception as e:
                logger.error(f"Error parsing Unstop opportunity: {e}")
        
        return hackathons
    
    def _parse_opportunity(self, opp: dict) -> Optional[HackathonCreate]:
        """Parse a single opportunity from Unstop."""
        name = opp.get("title", "")
        if not name:
            return None
        
        # Build URL
        slug = opp.get("seo_url", opp.get("public_url", ""))
        url = f"https://unstop.com/hackathons/{slug}" if slug else "https://unstop.com"
        
        # Description
        description = opp.get("short_desc", opp.get("description", ""))
        description = self.clean_text(description[:500] if description else "")
        
        # Parse dates
        start_date = self.normalize_date(opp.get("start_date", ""))
        end_date = self.normalize_date(opp.get("end_date", ""))
        
        # Submission deadline (registration end or round end)
        deadline_str = opp.get("regnRequirements", {}).get("end_regn_dt", "") or \
                       opp.get("end_date", "")
        submission_deadline = self.normalize_date(deadline_str)
        
        if not submission_deadline:
            from datetime import timedelta
            submission_deadline = datetime.utcnow() + timedelta(days=30)
        
        # Mode
        venue = opp.get("venue", "")
        mode = self.normalize_mode(venue)
        
        # Location
        location = opp.get("city", "") or opp.get("region", "")
        if isinstance(location, dict):
            location = location.get("name", "")
        
        # Prize
        prize_data = opp.get("prizes", [])
        prize_pool = None
        if prize_data:
            if isinstance(prize_data, list) and len(prize_data) > 0:
                prize_pool = str(prize_data[0].get("cash", "")) if isinstance(prize_data[0], dict) else str(prize_data[0])
            elif isinstance(prize_data, dict):
                prize_pool = str(prize_data.get("total", ""))
        
        # Tags
        tags = []
        categories = opp.get("filters", [])
        for cat in categories:
            if isinstance(cat, dict):
                tag = cat.get("name", "")
            else:
                tag = str(cat)
            if tag:
                tags.append(tag)
        
        # Image
        image_url = opp.get("banner_mobile", "") or opp.get("logo", "")
        
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
