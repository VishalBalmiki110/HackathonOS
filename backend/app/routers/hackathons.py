"""Hackathon routes."""

from datetime import datetime
from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_

from app.database import get_db
from app.models.hackathon import Hackathon
from app.schemas.hackathon import (
    HackathonCreate,
    HackathonUpdate,
    HackathonResponse,
    HackathonList,
)

router = APIRouter()


@router.get("", response_model=HackathonList)
async def list_hackathons(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    platform: Optional[str] = None,
    mode: Optional[str] = None,
    search: Optional[str] = None,
    upcoming_only: bool = True,
):
    """
    List all hackathons with filtering and pagination.
    """
    query = select(Hackathon)
    
    # Filters
    if upcoming_only:
        query = query.where(Hackathon.submission_deadline >= datetime.utcnow())
    
    if platform:
        query = query.where(Hackathon.platform == platform)
    
    if mode:
        query = query.where(Hackathon.mode == mode)
    
    if search:
        search_filter = or_(
            Hackathon.name.ilike(f"%{search}%"),
            Hackathon.description.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Paginate
    query = query.order_by(Hackathon.submission_deadline.asc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    hackathons = result.scalars().all()
    
    # Calculate days until deadline
    items = []
    for h in hackathons:
        item = HackathonResponse.model_validate(h)
        if h.submission_deadline:
            delta = h.submission_deadline - datetime.utcnow()
            item.days_until_deadline = max(0, delta.days)
        items.append(item)
    
    return HackathonList(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.get("/{hackathon_id}", response_model=HackathonResponse)
async def get_hackathon(
    hackathon_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific hackathon by ID."""
    result = await db.execute(
        select(Hackathon).where(Hackathon.id == hackathon_id)
    )
    hackathon = result.scalar_one_or_none()
    
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    
    response = HackathonResponse.model_validate(hackathon)
    if hackathon.submission_deadline:
        delta = hackathon.submission_deadline - datetime.utcnow()
        response.days_until_deadline = max(0, delta.days)
    
    return response


@router.post("", response_model=HackathonResponse)
async def create_hackathon(
    hackathon: HackathonCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new hackathon (used by scrapers)."""
    db_hackathon = Hackathon(**hackathon.model_dump())
    db.add(db_hackathon)
    await db.commit()
    await db.refresh(db_hackathon)
    return db_hackathon


@router.patch("/{hackathon_id}", response_model=HackathonResponse)
async def update_hackathon(
    hackathon_id: UUID,
    hackathon_update: HackathonUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a hackathon."""
    result = await db.execute(
        select(Hackathon).where(Hackathon.id == hackathon_id)
    )
    hackathon = result.scalar_one_or_none()
    
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    
    update_data = hackathon_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(hackathon, key, value)
    
    await db.commit()
    await db.refresh(hackathon)
    return hackathon


@router.get("/platforms/list", response_model=list[str])
async def list_platforms(db: AsyncSession = Depends(get_db)):
    """Get list of all hackathon platforms."""
    result = await db.execute(
        select(Hackathon.platform).distinct()
    )
    platforms = result.scalars().all()
    return platforms
