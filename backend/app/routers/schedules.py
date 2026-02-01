"""Schedule routes."""

from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.hackathon import Hackathon
from app.models.schedule import Schedule, ScheduleSession
from app.schemas.schedule import ScheduleCreate, ScheduleResponse, ScheduleList
from app.routers.auth import get_current_user
from app.services.scheduler import SchedulingService

router = APIRouter()


@router.get("", response_model=ScheduleList)
async def list_schedules(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    status: str = None,
):
    """List all schedules for the current user."""
    query = (
        select(Schedule)
        .where(Schedule.user_id == current_user.id)
        .options(selectinload(Schedule.hackathon), selectinload(Schedule.sessions))
        .order_by(Schedule.created_at.desc())
    )
    
    if status:
        query = query.where(Schedule.status == status)
    
    result = await db.execute(query)
    schedules = result.scalars().all()
    
    return ScheduleList(items=schedules, total=len(schedules))


@router.post("", response_model=ScheduleResponse)
async def create_schedule(
    schedule_create: ScheduleCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new schedule for a hackathon.
    
    This will generate work sessions based on user availability
    and the hackathon deadline.
    """
    # Check if hackathon exists
    result = await db.execute(
        select(Hackathon).where(Hackathon.id == schedule_create.hackathon_id)
    )
    hackathon = result.scalar_one_or_none()
    
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    
    # Check if deadline has passed
    if hackathon.submission_deadline <= datetime.utcnow():
        raise HTTPException(
            status_code=400,
            detail="Cannot schedule for a hackathon with a past deadline",
        )
    
    # Check for existing schedule
    result = await db.execute(
        select(Schedule).where(
            Schedule.user_id == current_user.id,
            Schedule.hackathon_id == hackathon.id,
        )
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="A schedule already exists for this hackathon",
        )
    
    # Generate schedule using the scheduling service
    scheduler = SchedulingService(db)
    schedule = await scheduler.generate_schedule(
        user=current_user,
        hackathon=hackathon,
        start_from=schedule_create.start_from,
    )
    
    await db.commit()
    
    # Reload with relationships
    result = await db.execute(
        select(Schedule)
        .where(Schedule.id == schedule.id)
        .options(selectinload(Schedule.hackathon), selectinload(Schedule.sessions))
    )
    schedule = result.scalar_one()
    
    return schedule


@router.get("/{schedule_id}", response_model=ScheduleResponse)
async def get_schedule(
    schedule_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific schedule by ID."""
    result = await db.execute(
        select(Schedule)
        .where(Schedule.id == schedule_id, Schedule.user_id == current_user.id)
        .options(selectinload(Schedule.hackathon), selectinload(Schedule.sessions))
    )
    schedule = result.scalar_one_or_none()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    return schedule


@router.patch("/{schedule_id}/activate", response_model=ScheduleResponse)
async def activate_schedule(
    schedule_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Activate a draft schedule."""
    result = await db.execute(
        select(Schedule)
        .where(Schedule.id == schedule_id, Schedule.user_id == current_user.id)
        .options(selectinload(Schedule.hackathon), selectinload(Schedule.sessions))
    )
    schedule = result.scalar_one_or_none()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    if schedule.status != "draft":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot activate schedule with status '{schedule.status}'",
        )
    
    schedule.status = "active"
    await db.commit()
    await db.refresh(schedule)
    
    return schedule


@router.delete("/{schedule_id}")
async def delete_schedule(
    schedule_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a schedule and all its sessions."""
    result = await db.execute(
        select(Schedule).where(
            Schedule.id == schedule_id, Schedule.user_id == current_user.id
        )
    )
    schedule = result.scalar_one_or_none()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    await db.delete(schedule)
    await db.commit()
    
    return {"status": "deleted"}


@router.post("/{schedule_id}/regenerate", response_model=ScheduleResponse)
async def regenerate_schedule(
    schedule_id: UUID,
    start_from: datetime = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Regenerate sessions for an existing schedule."""
    result = await db.execute(
        select(Schedule)
        .where(Schedule.id == schedule_id, Schedule.user_id == current_user.id)
        .options(selectinload(Schedule.hackathon), selectinload(Schedule.sessions))
    )
    schedule = result.scalar_one_or_none()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    # Delete existing sessions
    for session in schedule.sessions:
        await db.delete(session)
    
    # Regenerate
    scheduler = SchedulingService(db)
    schedule = await scheduler.regenerate_sessions(
        schedule=schedule,
        user=current_user,
        start_from=start_from,
    )
    
    await db.commit()
    
    # Reload
    result = await db.execute(
        select(Schedule)
        .where(Schedule.id == schedule.id)
        .options(selectinload(Schedule.hackathon), selectinload(Schedule.sessions))
    )
    schedule = result.scalar_one()
    
    return schedule
