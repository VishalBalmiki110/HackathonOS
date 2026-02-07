"""
Calendar Service for HackathonOS.

Handles Google Calendar integration and ICS export.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from icalendar import Calendar, Event, vText
import uuid

from app.models.user import User
from app.models.schedule import Schedule, ScheduleSession
from app.config import get_settings

settings = get_settings()


class CalendarService:
    """Service for calendar integration."""
    
    async def sync_schedule(
        self,
        schedule: Schedule,
        user: User,
        db: AsyncSession,
    ) -> int:
        """
        Sync schedule sessions to Google Calendar.
        
        Returns the number of synced sessions.
        """
        if not user.google_calendar_refresh_token and not user.google_access_token:
            raise ValueError("User has not authorized Google Calendar access. Please sign out and sign in again.")
        
        # Get Google Calendar service
        service = await self._get_calendar_service(user)
        
        synced_count = 0
        for session in schedule.sessions:
            if session.is_synced and session.calendar_event_id:
                # Update existing event
                await self._update_calendar_event(service, session)
            else:
                # Create new event
                event_id = await self._create_calendar_event(
                    service, session, schedule.hackathon.name
                )
                session.calendar_event_id = event_id
                session.is_synced = True
            
            synced_count += 1
        
        return synced_count
    
    async def remove_schedule_events(
        self,
        schedule: Schedule,
        user: User,
        db: AsyncSession,
    ) -> int:
        """
        Remove schedule events from Google Calendar.
        
        Returns the number of removed events.
        """
        if not user.google_calendar_refresh_token and not user.google_access_token:
            raise ValueError("User has not authorized Google Calendar access")
        
        service = await self._get_calendar_service(user)
        
        removed_count = 0
        for session in schedule.sessions:
            if session.is_synced and session.calendar_event_id:
                await self._delete_calendar_event(service, session.calendar_event_id)
                session.calendar_event_id = None
                session.is_synced = False
                removed_count += 1
        
        return removed_count
    
    def generate_ics(self, schedule: Schedule) -> bytes:
        """
        Generate an ICS file for a schedule.
        
        Returns the ICS content as bytes.
        """
        cal = Calendar()
        cal.add("prodid", "-//HackathonOS//hackathonos.io//")
        cal.add("version", "2.0")
        cal.add("calscale", "GREGORIAN")
        cal.add("method", "PUBLISH")
        cal.add("x-wr-calname", f"HackathonOS - {schedule.hackathon.name}")
        
        for session in schedule.sessions:
            event = Event()
            event.add("uid", f"{session.id}@hackathonos.io")
            event.add("dtstamp", datetime.utcnow())
            event.add("dtstart", session.start_time)
            event.add("dtend", session.end_time)
            event.add("summary", session.title or f"{schedule.hackathon.name} - {session.phase.title()}")
            
            if session.description:
                event.add("description", session.description)
            
            # Add phase as category
            event.add("categories", [session.phase.upper()])
            
            # Add color based on phase
            phase_colors = {
                "preparation": "yellow",
                "building": "blue", 
                "submission": "green",
            }
            if session.phase in phase_colors:
                event.add("color", phase_colors[session.phase])
            
            cal.add_component(event)
        
        # Add deadline event
        deadline_event = Event()
        deadline_event.add("uid", f"deadline-{schedule.id}@hackathonos.io")
        deadline_event.add("dtstamp", datetime.utcnow())
        deadline_event.add("dtstart", schedule.hackathon.submission_deadline)
        deadline_event.add("dtend", schedule.hackathon.submission_deadline)
        deadline_event.add("summary", f"🚨 DEADLINE: {schedule.hackathon.name}")
        deadline_event.add("description", f"Submission deadline for {schedule.hackathon.name}")
        deadline_event.add("categories", ["DEADLINE"])
        cal.add_component(deadline_event)
        
        return cal.to_ical()
    
    async def _get_calendar_service(self, user: User):
        """Get authenticated Google Calendar service."""
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build
        
        # Use refresh token if available, otherwise use access token
        credentials = Credentials(
            token=user.google_access_token,
            refresh_token=user.google_calendar_refresh_token,
            client_id=settings.google_client_id,
            client_secret=settings.google_client_secret,
            token_uri="https://oauth2.googleapis.com/token",
        )
        
        service = build("calendar", "v3", credentials=credentials)
        return service
    
    async def _create_calendar_event(
        self,
        service,
        session: ScheduleSession,
        hackathon_name: str,
    ) -> str:
        """Create a calendar event and return its ID."""
        phase_colors = {
            "preparation": "5",  # Yellow
            "building": "9",     # Blue
            "submission": "10",  # Green
        }
        
        event = {
            "summary": session.title or f"{hackathon_name} - {session.phase.title()}",
            "description": session.description,
            "start": {
                "dateTime": session.start_time.isoformat(),
                "timeZone": "UTC",
            },
            "end": {
                "dateTime": session.end_time.isoformat(),
                "timeZone": "UTC",
            },
            "colorId": phase_colors.get(session.phase, "7"),
            "reminders": {
                "useDefault": False,
                "overrides": [
                    {"method": "popup", "minutes": 15},
                ],
            },
        }
        
        result = service.events().insert(calendarId="primary", body=event).execute()
        return result["id"]
    
    async def _update_calendar_event(self, service, session: ScheduleSession):
        """Update an existing calendar event."""
        event = service.events().get(
            calendarId="primary", eventId=session.calendar_event_id
        ).execute()
        
        event["summary"] = session.title
        event["description"] = session.description
        event["start"]["dateTime"] = session.start_time.isoformat()
        event["end"]["dateTime"] = session.end_time.isoformat()
        
        service.events().update(
            calendarId="primary",
            eventId=session.calendar_event_id,
            body=event,
        ).execute()
    
    async def _delete_calendar_event(self, service, event_id: str):
        """Delete a calendar event."""
        try:
            service.events().delete(calendarId="primary", eventId=event_id).execute()
        except Exception:
            # Event may already be deleted
            pass
