"""Timezone API routes."""

from fastapi import APIRouter, Depends, Query
from datetime import datetime
from typing import Optional

from app.services.timezone import (
    normalize_timezone,
    convert_time,
    get_timezone_offset,
    format_timezone_display,
    calculate_overlap,
    get_common_timezones,
)

router = APIRouter()


@router.get("/list")
async def list_timezones():
    """Get list of common timezones."""
    return {"timezones": get_common_timezones()}


@router.get("/convert")
async def convert_timezone(
    datetime_str: str = Query(..., description="ISO format datetime"),
    from_tz: str = Query(..., description="Source timezone"),
    to_tz: str = Query(..., description="Target timezone"),
):
    """Convert a datetime between timezones."""
    try:
        dt = datetime.fromisoformat(datetime_str.replace("Z", "+00:00"))
    except ValueError:
        return {"error": "Invalid datetime format. Use ISO format."}
    
    converted = convert_time(dt, from_tz, to_tz)
    
    return {
        "original": datetime_str,
        "from_timezone": from_tz,
        "to_timezone": to_tz,
        "converted": converted.isoformat(),
        "formatted": converted.strftime("%B %d, %Y at %I:%M %p %Z"),
    }


@router.get("/info")
async def timezone_info(tz: str = Query(..., description="Timezone to get info for")):
    """Get information about a timezone."""
    normalized = normalize_timezone(tz)
    if not normalized:
        return {"error": f"Unknown timezone: {tz}"}
    
    hours, minutes = get_timezone_offset(normalized)
    
    return {
        "timezone": normalized,
        "display": format_timezone_display(normalized),
        "offset_hours": hours,
        "offset_minutes": minutes,
        "current_time": datetime.now().astimezone().isoformat(),
    }


@router.get("/overlap")
async def check_overlap(
    user_tz: str = Query(..., description="User's timezone"),
    hackathon_tz: str = Query(..., description="Hackathon's timezone"),
    hackathon_start: str = Query(..., description="Hackathon start datetime (ISO)"),
    hackathon_end: str = Query(..., description="Hackathon end datetime (ISO)"),
    pref_start_hour: int = Query(9, description="User's preferred start hour"),
    pref_end_hour: int = Query(21, description="User's preferred end hour"),
):
    """Calculate timezone overlap for hackathon planning."""
    try:
        start = datetime.fromisoformat(hackathon_start.replace("Z", "+00:00"))
        end = datetime.fromisoformat(hackathon_end.replace("Z", "+00:00"))
    except ValueError:
        return {"error": "Invalid datetime format. Use ISO format."}
    
    result = calculate_overlap(
        user_tz,
        hackathon_tz,
        start,
        end,
        (pref_start_hour, pref_end_hour),
    )
    
    return result
