"""Bookmark routes."""

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.bookmark import Bookmark
from app.models.hackathon import Hackathon
from app.routers.auth import get_current_user

router = APIRouter()


class BookmarkResponse(BaseModel):
    id: UUID
    hackathon_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.get("/", response_model=list[BookmarkResponse])
async def get_bookmarks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all bookmarked hackathons for current user."""
    result = await db.execute(
        select(Bookmark)
        .where(Bookmark.user_id == current_user.id)
        .order_by(Bookmark.created_at.desc())
    )
    return result.scalars().all()


@router.get("/hackathons")
async def get_bookmarked_hackathons(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all bookmarked hackathon details for current user."""
    result = await db.execute(
        select(Hackathon)
        .join(Bookmark, Bookmark.hackathon_id == Hackathon.id)
        .where(Bookmark.user_id == current_user.id)
        .order_by(Bookmark.created_at.desc())
    )
    hackathons = result.scalars().all()
    return [
        {
            "id": str(h.id),
            "name": h.name,
            "platform": h.platform,
            "mode": h.mode,
            "submission_deadline": h.submission_deadline.isoformat() if h.submission_deadline else None,
            "prize_pool": h.prize_pool,
            "url": h.url,
            "image_url": h.image_url,
        }
        for h in hackathons
    ]


@router.post("/{hackathon_id}")
async def bookmark_hackathon(
    hackathon_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Bookmark a hackathon."""
    # Check if hackathon exists
    result = await db.execute(
        select(Hackathon).where(Hackathon.id == hackathon_id)
    )
    hackathon = result.scalar_one_or_none()
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    
    # Check if already bookmarked
    result = await db.execute(
        select(Bookmark).where(
            Bookmark.user_id == current_user.id,
            Bookmark.hackathon_id == hackathon_id
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        return {"status": "already_bookmarked", "id": str(existing.id)}
    
    # Create bookmark
    bookmark = Bookmark(user_id=current_user.id, hackathon_id=hackathon_id)
    db.add(bookmark)
    await db.commit()
    await db.refresh(bookmark)
    
    return {"status": "bookmarked", "id": str(bookmark.id)}


@router.delete("/{hackathon_id}")
async def unbookmark_hackathon(
    hackathon_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a bookmark."""
    result = await db.execute(
        select(Bookmark).where(
            Bookmark.user_id == current_user.id,
            Bookmark.hackathon_id == hackathon_id
        )
    )
    bookmark = result.scalar_one_or_none()
    
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    
    await db.delete(bookmark)
    await db.commit()
    
    return {"status": "unbookmarked"}


@router.get("/check/{hackathon_id}")
async def check_bookmark(
    hackathon_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Check if a hackathon is bookmarked."""
    result = await db.execute(
        select(Bookmark).where(
            Bookmark.user_id == current_user.id,
            Bookmark.hackathon_id == hackathon_id
        )
    )
    bookmark = result.scalar_one_or_none()
    return {"bookmarked": bookmark is not None}
