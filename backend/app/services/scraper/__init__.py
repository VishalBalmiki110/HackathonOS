"""Hackathon scrapers package."""

from app.services.scraper.base import BaseScraper
from app.services.scraper.devpost import DevpostScraper
from app.services.scraper.dorahacks import DoraHacksScraper
from app.services.scraper.mlh import MLHScraper
from app.services.scraper.unstop import UnstopScraper

__all__ = ["BaseScraper", "DevpostScraper", "DoraHacksScraper", "MLHScraper", "UnstopScraper"]
