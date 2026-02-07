import logging
import json
import ssl
import aiohttp
from datetime import datetime
from typing import Optional

from app.schemas.hackathon import HackathonCreate
from app.services.scraper.base import BaseScraper

logger = logging.getLogger(__name__)

class DoraHacksScraper(BaseScraper):
    platform = "dorahacks"
    
    async def fetch_hackathons(self) -> list[HackathonCreate]:
        """
        Fetch hackathons from DoraHacks API.
        """
        results = []
        base_url = "https://dorahacks.io/api/hackathon/"
        params = {
            "page": 1,
            "page_size": 20, 
        }
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        }

        try:
            # Create a custom SSL context that does not verify certificates
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE

            async with aiohttp.ClientSession() as session:
                async with session.get(base_url, params=params, headers=headers, ssl=ssl_context) as response:
                    if response.status != 200:
                        logger.error(f"Failed to fetch DoraHacks: {response.status}")
                        return []
                    
                    data = await response.json()
                    
                    if "results" not in data:
                        logger.warning("No 'results' field in DoraHacks API response")
                        return []
                    
                    for item in data["results"]:
                        try:
                            hackathon = self._parse_hackathon(item)
                            if hackathon:
                                results.append(hackathon)
                        except Exception as e:
                            logger.error(f"Error parsing DoraHacks item: {e}")
                            continue

        except Exception as e:
            logger.error(f"Error fetching DoraHacks data: {e}")
            
        return results

    def _parse_hackathon(self, item: dict) -> Optional[HackathonCreate]:
        name = item.get("title") or item.get("name")
        if not name:
            return None
            
        slug = item.get("uname") or str(item.get("id"))
        url = f"https://dorahacks.io/hackathon/{slug}"
        
        description = item.get("description", "") or f"DoraHacks Hackathon: {name}"
        
        # Handle timestamps (which appear to be in seconds based on debug output)
        start_time = item.get("start_time")
        end_time = item.get("end_time")
        submission_end_time = item.get("submission_end_time")
        
        start_date = datetime.fromtimestamp(start_time) if start_time else None
        end_date = datetime.fromtimestamp(end_time) if end_time else None
        submission_deadline = datetime.fromtimestamp(submission_end_time) if submission_end_time else end_date
        
        # Determine mode
        location = item.get("location") or item.get("venue_name") or item.get("venue_address")
        mode = "in-person" if location else "online"
        
        # DoraHacks doesn't seem to have a unified 'prize' field in the list API easily accessible,
        # but sometimes it might be in 'token' or description. We'll leave it empty or default.
        prize_pool = "See details"
        
        image_url = item.get("image_url") or item.get("logo")
        if not image_url and item.get("organization"):
            image_url = item.get("organization", {}).get("logo")

        return HackathonCreate(
            name=name,
            platform=self.platform,
            url=url,
            description=description,
            start_date=start_date,
            end_date=end_date,
            submission_deadline=submission_deadline,
            mode=mode,
            location=location or "Online",
            prize_pool=prize_pool,
            image_url=image_url,
            tags=["dorahacks"]
        )
