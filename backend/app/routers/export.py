"""Export API routes for schedules and data."""

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta
from typing import Optional
import json

from app.database import get_db
from app.models.user import User
from app.models.schedule import Schedule, ScheduleSession
from app.models.hackathon import Hackathon
from app.routers.auth import get_current_user

router = APIRouter()


def generate_ics(schedule, hackathon, sessions) -> str:
    """Generate ICS calendar file content."""
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//HackathonOS//Schedule Export//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        f"X-WR-CALNAME:{hackathon.name} Schedule",
    ]
    
    for session in sessions:
        start_dt = session.start_time.strftime("%Y%m%dT%H%M%SZ")
        end_dt = session.end_time.strftime("%Y%m%dT%H%M%SZ")
        created = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
        
        lines.extend([
            "BEGIN:VEVENT",
            f"UID:{session.id}@hackathonos.app",
            f"DTSTAMP:{created}",
            f"DTSTART:{start_dt}",
            f"DTEND:{end_dt}",
            f"SUMMARY:{session.title}",
            f"DESCRIPTION:{session.description or ''}",
            f"LOCATION:HackathonOS - {hackathon.name}",
            f"CATEGORIES:{session.session_type}",
            "STATUS:CONFIRMED",
            "END:VEVENT",
        ])
    
    lines.append("END:VCALENDAR")
    return "\r\n".join(lines)


def generate_json_export(schedule, hackathon, sessions) -> dict:
    """Generate JSON export of schedule."""
    return {
        "export_date": datetime.utcnow().isoformat(),
        "hackathon": {
            "id": str(hackathon.id),
            "name": hackathon.name,
            "start_date": hackathon.start_date.isoformat() if hackathon.start_date else None,
            "end_date": hackathon.end_date.isoformat() if hackathon.end_date else None,
            "url": hackathon.url,
        },
        "schedule": {
            "id": str(schedule.id),
            "name": schedule.name,
            "total_hours": schedule.total_hours,
            "status": schedule.status,
            "created_at": schedule.created_at.isoformat(),
        },
        "sessions": [
            {
                "id": str(s.id),
                "title": s.title,
                "description": s.description,
                "session_type": s.session_type,
                "start_time": s.start_time.isoformat(),
                "end_time": s.end_time.isoformat(),
                "duration_hours": (s.end_time - s.start_time).total_seconds() / 3600,
            }
            for s in sessions
        ],
    }


def generate_markdown_export(schedule, hackathon, sessions) -> str:
    """Generate Markdown export of schedule."""
    lines = [
        f"# {hackathon.name} - Schedule",
        "",
        f"**Created**: {schedule.created_at.strftime('%B %d, %Y')}",
        f"**Total Hours**: {schedule.total_hours:.1f}",
        f"**Status**: {schedule.status}",
        "",
        "---",
        "",
        "## Sessions",
        "",
    ]
    
    # Group sessions by date
    sessions_by_date = {}
    for session in sorted(sessions, key=lambda s: s.start_time):
        date_key = session.start_time.strftime("%A, %B %d, %Y")
        if date_key not in sessions_by_date:
            sessions_by_date[date_key] = []
        sessions_by_date[date_key].append(session)
    
    for date, day_sessions in sessions_by_date.items():
        lines.append(f"### {date}")
        lines.append("")
        for session in day_sessions:
            start = session.start_time.strftime("%I:%M %p")
            end = session.end_time.strftime("%I:%M %p")
            duration = (session.end_time - session.start_time).total_seconds() / 3600
            lines.append(f"- **{start} - {end}** ({duration:.1f}h): {session.title}")
            if session.description:
                lines.append(f"  - {session.description}")
        lines.append("")
    
    lines.extend([
        "---",
        "",
        f"*Exported from HackathonOS on {datetime.utcnow().strftime('%B %d, %Y at %I:%M %p')} UTC*",
    ])
    
    return "\n".join(lines)


@router.get("/schedules/{schedule_id}/export")
async def export_schedule(
    schedule_id: UUID,
    format: str = "json",  # json, ics, markdown
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Export a schedule in various formats."""
    # Get schedule with sessions
    result = await db.execute(
        select(Schedule)
        .where(Schedule.id == schedule_id)
        .options(selectinload(Schedule.sessions))
    )
    schedule = result.scalar_one_or_none()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    # Get hackathon
    result = await db.execute(
        select(Hackathon).where(Hackathon.id == schedule.hackathon_id)
    )
    hackathon = result.scalar_one_or_none()
    
    sessions = sorted(schedule.sessions, key=lambda s: s.start_time)
    
    if format == "ics":
        content = generate_ics(schedule, hackathon, sessions)
        filename = f"{hackathon.name.replace(' ', '_')}_schedule.ics"
        return Response(
            content=content,
            media_type="text/calendar",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    
    elif format == "markdown" or format == "md":
        content = generate_markdown_export(schedule, hackathon, sessions)
        filename = f"{hackathon.name.replace(' ', '_')}_schedule.md"
        return Response(
            content=content,
            media_type="text/markdown",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    
    else:  # json (default)
        data = generate_json_export(schedule, hackathon, sessions)
        return data


@router.get("/schedules/{schedule_id}/export/preview")
async def preview_export(
    schedule_id: UUID,
    format: str = "markdown",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Preview export content without downloading."""
    result = await db.execute(
        select(Schedule)
        .where(Schedule.id == schedule_id)
        .options(selectinload(Schedule.sessions))
    )
    schedule = result.scalar_one_or_none()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    result = await db.execute(
        select(Hackathon).where(Hackathon.id == schedule.hackathon_id)
    )
    hackathon = result.scalar_one_or_none()
    
    sessions = sorted(schedule.sessions, key=lambda s: s.start_time)
    
    if format == "markdown" or format == "md":
        content = generate_markdown_export(schedule, hackathon, sessions)
    elif format == "ics":
        content = generate_ics(schedule, hackathon, sessions)
    else:
        content = json.dumps(generate_json_export(schedule, hackathon, sessions), indent=2)
    
    return {"format": format, "content": content}
