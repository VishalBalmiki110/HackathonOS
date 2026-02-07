"""Timezone intelligence utilities."""

from datetime import datetime, timedelta
from typing import Optional, Tuple
import pytz


# Common timezone mappings
TIMEZONE_ALIASES = {
    "PT": "America/Los_Angeles",
    "PST": "America/Los_Angeles",
    "PDT": "America/Los_Angeles",
    "MT": "America/Denver",
    "MST": "America/Denver",
    "MDT": "America/Denver",
    "CT": "America/Chicago",
    "CST": "America/Chicago",
    "CDT": "America/Chicago",
    "ET": "America/New_York",
    "EST": "America/New_York",
    "EDT": "America/New_York",
    "UTC": "UTC",
    "GMT": "UTC",
    "IST": "Asia/Kolkata",
    "CET": "Europe/Paris",
    "CEST": "Europe/Paris",
    "JST": "Asia/Tokyo",
    "AEST": "Australia/Sydney",
    "AEDT": "Australia/Sydney",
}


def normalize_timezone(tz_string: str) -> Optional[str]:
    """Normalize a timezone string to a valid pytz timezone."""
    if not tz_string:
        return None
    
    # Check if it's an alias
    tz_upper = tz_string.upper().strip()
    if tz_upper in TIMEZONE_ALIASES:
        return TIMEZONE_ALIASES[tz_upper]
    
    # Try as-is
    try:
        pytz.timezone(tz_string)
        return tz_string
    except pytz.UnknownTimezonezError:
        pass
    
    # Try common formats
    try:
        pytz.timezone(tz_string.replace(" ", "_"))
        return tz_string.replace(" ", "_")
    except:
        pass
    
    return None


def convert_time(
    dt: datetime,
    from_tz: str,
    to_tz: str,
) -> datetime:
    """Convert a datetime from one timezone to another."""
    from_timezone = pytz.timezone(normalize_timezone(from_tz) or "UTC")
    to_timezone = pytz.timezone(normalize_timezone(to_tz) or "UTC")
    
    # If datetime is naive, localize it
    if dt.tzinfo is None:
        dt = from_timezone.localize(dt)
    else:
        dt = dt.astimezone(from_timezone)
    
    return dt.astimezone(to_timezone)


def get_timezone_offset(tz_string: str) -> Tuple[int, int]:
    """Get timezone offset in hours and minutes."""
    tz = pytz.timezone(normalize_timezone(tz_string) or "UTC")
    now = datetime.now(tz)
    offset = now.utcoffset()
    
    if offset is None:
        return (0, 0)
    
    total_seconds = int(offset.total_seconds())
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    
    return (hours, minutes)


def format_timezone_display(tz_string: str) -> str:
    """Format a timezone for display (e.g., 'America/New_York (EST, UTC-5)')."""
    normalized = normalize_timezone(tz_string)
    if not normalized:
        return tz_string
    
    hours, minutes = get_timezone_offset(normalized)
    sign = "+" if hours >= 0 else ""
    offset_str = f"UTC{sign}{hours}"
    if minutes:
        offset_str += f":{abs(minutes):02d}"
    
    # Get abbreviation
    tz = pytz.timezone(normalized)
    abbr = datetime.now(tz).strftime("%Z")
    
    return f"{normalized} ({abbr}, {offset_str})"


def calculate_overlap(
    user_tz: str,
    hackathon_tz: str,
    hackathon_start: datetime,
    hackathon_end: datetime,
    preferred_hours: Tuple[int, int] = (9, 21),  # 9 AM to 9 PM
) -> dict:
    """Calculate the overlap between user's preferred hours and hackathon times."""
    user_timezone = pytz.timezone(normalize_timezone(user_tz) or "UTC")
    hackathon_timezone = pytz.timezone(normalize_timezone(hackathon_tz) or "UTC")
    
    # Convert hackathon times to user's timezone
    if hackathon_start.tzinfo is None:
        hackathon_start = hackathon_timezone.localize(hackathon_start)
    if hackathon_end.tzinfo is None:
        hackathon_end = hackathon_timezone.localize(hackathon_end)
    
    user_start = hackathon_start.astimezone(user_timezone)
    user_end = hackathon_end.astimezone(user_timezone)
    
    # Calculate if times fall in preferred hours
    start_hour = user_start.hour
    end_hour = user_end.hour
    
    pref_start, pref_end = preferred_hours
    
    # Simple overlap calculation
    in_preferred_start = pref_start <= start_hour <= pref_end
    in_preferred_end = pref_start <= end_hour <= pref_end
    
    return {
        "user_start": user_start.isoformat(),
        "user_end": user_end.isoformat(),
        "hackathon_timezone": hackathon_tz,
        "user_timezone": user_tz,
        "offset_hours": get_timezone_offset(user_tz)[0] - get_timezone_offset(hackathon_tz)[0],
        "start_in_preferred_hours": in_preferred_start,
        "end_in_preferred_hours": in_preferred_end,
        "recommendation": "optimal" if in_preferred_start and in_preferred_end else "adjust_schedule",
    }


def get_common_timezones() -> list[dict]:
    """Get a list of common timezones for selection."""
    common = [
        "America/Los_Angeles",
        "America/Denver",
        "America/Chicago",
        "America/New_York",
        "America/Toronto",
        "America/Sao_Paulo",
        "Europe/London",
        "Europe/Paris",
        "Europe/Berlin",
        "Asia/Dubai",
        "Asia/Kolkata",
        "Asia/Singapore",
        "Asia/Tokyo",
        "Asia/Shanghai",
        "Australia/Sydney",
        "Pacific/Auckland",
    ]
    
    return [
        {
            "value": tz,
            "label": format_timezone_display(tz),
            "offset": get_timezone_offset(tz)[0],
        }
        for tz in common
    ]
