"""Calendar integration routes."""

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.schedule import Schedule
from app.routers.auth import get_current_user
from app.services.calendar import CalendarService

router = APIRouter()


@router.post("/sync/{schedule_id}")
async def sync_to_google_calendar(
    schedule_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Sync a schedule's sessions to Google Calendar.
    
    Requires the user to have connected their Google Calendar.
    """
    if not current_user.google_calendar_connected:
        raise HTTPException(
            status_code=400,
            detail="Google Calendar not connected. Please authorize calendar access.",
        )
    
    result = await db.execute(
        select(Schedule)
        .where(Schedule.id == schedule_id, Schedule.user_id == current_user.id)
        .options(selectinload(Schedule.hackathon), selectinload(Schedule.sessions))
    )
    schedule = result.scalar_one_or_none()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    # Sync to calendar
    calendar_service = CalendarService()
    synced_count = await calendar_service.sync_schedule(
        schedule=schedule,
        user=current_user,
        db=db,
    )
    
    await db.commit()
    
    return {
        "status": "synced",
        "synced_sessions": synced_count,
    }


@router.get("/export/{schedule_id}")
async def export_ics(
    schedule_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Export a schedule as an ICS file for manual calendar import.
    """
    result = await db.execute(
        select(Schedule)
        .where(Schedule.id == schedule_id, Schedule.user_id == current_user.id)
        .options(selectinload(Schedule.hackathon), selectinload(Schedule.sessions))
    )
    schedule = result.scalar_one_or_none()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    # Generate ICS
    calendar_service = CalendarService()
    ics_content = calendar_service.generate_ics(schedule)
    
    filename = f"hackathonos-{schedule.hackathon.name.lower().replace(' ', '-')}.ics"
    
    return Response(
        content=ics_content,
        media_type="text/calendar",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )


@router.delete("/unsync/{schedule_id}")
async def unsync_from_google_calendar(
    schedule_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Remove synced events from Google Calendar.
    """
    if not current_user.google_calendar_connected:
        raise HTTPException(
            status_code=400,
            detail="Google Calendar not connected",
        )
    
    result = await db.execute(
        select(Schedule)
        .where(Schedule.id == schedule_id, Schedule.user_id == current_user.id)
        .options(selectinload(Schedule.sessions))
    )
    schedule = result.scalar_one_or_none()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    # Remove from calendar
    calendar_service = CalendarService()
    removed_count = await calendar_service.remove_schedule_events(
        schedule=schedule,
        user=current_user,
        db=db,
    )
    
    await db.commit()
    
    return {
        "status": "unsynced",
        "removed_sessions": removed_count,
    }
