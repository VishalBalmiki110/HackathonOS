import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.services.scraper.dorahacks import DoraHacksScraper

async def main():
    print("Initializing DoraHacks Scraper...")
    scraper = DoraHacksScraper()
    print(f"Fetching hackathons from {scraper.platform}...")
    
    try:
        hackathons = await scraper.fetch_hackathons()
        print(f"\nSuccessfully fetched {len(hackathons)} hackathons.")
        
        print("\nTop 5 Results:")
        print("-" * 50)
        for i, h in enumerate(hackathons[:5], 1):
            print(f"{i}. {h.name}")
            print(f"   URL: {h.url}")
            print(f"   Date: {h.start_date} to {h.end_date}")
            print(f"   Mode: {h.mode}")
            print(f"   Location: {h.location}")
            print("-" * 50)
            
    except Exception as e:
        print(f"Error occurred: {e}")

if __name__ == "__main__":
    asyncio.run(main())
