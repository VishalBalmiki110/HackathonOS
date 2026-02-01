"""
Scheduling Service for HackathonOS.

Implements intelligent scheduling that converts hackathon deadlines
into structured work sessions based on user availability.

Phase Allocation (MVP):
- 30% → Preparation & Ideation
- 60% → Building & Iteration
- 10% → Testing & Submission Buffer
"""

from datetime import datetime, timedelta, time
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User, UserAvailability
from app.models.hackathon import Hackathon
from app.models.schedule import Schedule, ScheduleSession


# Phase allocation percentages
PHASE_ALLOCATION = {
    "preparation": 0.30,
    "building": 0.60,
    "submission": 0.10,
}

# Phase descriptions
PHASE_DESCRIPTIONS = {
    "preparation": "Research, ideation, and planning",
    "building": "Development and implementation",
    "submission": "Testing, documentation, and final submission",
}

# Default session duration in hours
DEFAULT_SESSION_HOURS = 2

# Default work hours per day if no availability set
DEFAULT_WORK_HOURS_PER_DAY = 4


class SchedulingService:
    """Service for generating and managing hackathon schedules."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def generate_schedule(
        self,
        user: User,
        hackathon: Hackathon,
        start_from: Optional[datetime] = None,
    ) -> Schedule:
        """
        Generate a complete schedule for a hackathon.
        
        Args:
            user: The user to create the schedule for
            hackathon: The hackathon to schedule
            start_from: Optional start date (defaults to now)
            
        Returns:
            The created Schedule with sessions
        """
        start = start_from or datetime.utcnow()
        deadline = hackathon.submission_deadline
        
        # Create the schedule
        schedule = Schedule(
            user_id=user.id,
            hackathon_id=hackathon.id,
            status="draft",
        )
        self.db.add(schedule)
        await self.db.flush()  # Get the ID
        
        # Generate sessions
        sessions = await self._generate_sessions(
            schedule=schedule,
            user=user,
            hackathon=hackathon,
            start=start,
            deadline=deadline,
        )
        
        # Calculate total hours
        total_hours = sum(s.duration_hours for s in sessions)
        schedule.total_hours = total_hours
        
        return schedule
    
    async def regenerate_sessions(
        self,
        schedule: Schedule,
        user: User,
        start_from: Optional[datetime] = None,
    ) -> Schedule:
        """Regenerate sessions for an existing schedule."""
        start = start_from or datetime.utcnow()
        deadline = schedule.hackathon.submission_deadline
        
        sessions = await self._generate_sessions(
            schedule=schedule,
            user=user,
            hackathon=schedule.hackathon,
            start=start,
            deadline=deadline,
        )
        
        total_hours = sum(s.duration_hours for s in sessions)
        schedule.total_hours = total_hours
        
        return schedule
    
    async def _generate_sessions(
        self,
        schedule: Schedule,
        user: User,
        hackathon: Hackathon,
        start: datetime,
        deadline: datetime,
    ) -> list[ScheduleSession]:
        """Generate work sessions for a schedule."""
        # Get user availability slots
        availability = await self._get_user_availability(user)
        
        # Calculate available slots between start and deadline
        available_slots = self._calculate_available_slots(
            availability=availability,
            start=start,
            deadline=deadline,
            work_hours_per_day=user.work_hours_per_day or DEFAULT_WORK_HOURS_PER_DAY,
        )
        
        # Calculate total available hours
        total_hours = sum(
            (slot["end"] - slot["start"]).total_seconds() / 3600
            for slot in available_slots
        )
        
        # Allocate hours to phases
        phase_hours = {
            phase: total_hours * percentage
            for phase, percentage in PHASE_ALLOCATION.items()
        }
        
        # Distribute sessions across available slots
        sessions = self._distribute_sessions(
            schedule=schedule,
            hackathon=hackathon,
            available_slots=available_slots,
            phase_hours=phase_hours,
        )
        
        # Add sessions to database
        for session in sessions:
            self.db.add(session)
        
        return sessions
    
    async def _get_user_availability(self, user: User) -> list[UserAvailability]:
        """Get user's availability slots."""
        result = await self.db.execute(
            select(UserAvailability)
            .where(UserAvailability.user_id == user.id, UserAvailability.is_available == True)
            .order_by(UserAvailability.day_of_week, UserAvailability.start_time)
        )
        availability = result.scalars().all()
        
        # If no availability set, create default (9am-5pm workdays)
        if not availability:
            return self._get_default_availability()
        
        return availability
    
    def _get_default_availability(self) -> list:
        """Get default availability (9am-5pm, weekdays)."""
        default = []
        for day in range(5):  # Monday to Friday
            default.append({
                "day_of_week": day,
                "start_time": time(9, 0),
                "end_time": time(17, 0),
            })
        return default
    
    def _calculate_available_slots(
        self,
        availability: list,
        start: datetime,
        deadline: datetime,
        work_hours_per_day: int,
    ) -> list[dict]:
        """
        Calculate concrete time slots based on availability rules.
        
        Returns a list of {"start": datetime, "end": datetime} slots.
        """
        slots = []
        current_date = start.date()
        end_date = deadline.date()
        
        while current_date <= end_date:
            day_of_week = current_date.weekday()  # 0 = Monday
            
            # Find availability for this day
            day_availability = [
                a for a in availability
                if (isinstance(a, dict) and a["day_of_week"] == day_of_week) or
                   (hasattr(a, "day_of_week") and a.day_of_week == day_of_week)
            ]
            
            hours_scheduled = 0
            for avail in day_availability:
                if hours_scheduled >= work_hours_per_day:
                    break
                
                if isinstance(avail, dict):
                    start_time = avail["start_time"]
                    end_time = avail["end_time"]
                else:
                    start_time = avail.start_time
                    end_time = avail.end_time
                
                slot_start = datetime.combine(current_date, start_time)
                slot_end = datetime.combine(current_date, end_time)
                
                # Adjust for start constraint
                if slot_start < start:
                    slot_start = start
                
                # Adjust for deadline constraint
                if slot_end > deadline:
                    slot_end = deadline
                
                if slot_start < slot_end:
                    # Limit to remaining work hours for the day
                    slot_duration = (slot_end - slot_start).total_seconds() / 3600
                    remaining = work_hours_per_day - hours_scheduled
                    
                    if slot_duration > remaining:
                        slot_end = slot_start + timedelta(hours=remaining)
                        slot_duration = remaining
                    
                    slots.append({
                        "start": slot_start,
                        "end": slot_end,
                    })
                    hours_scheduled += slot_duration
            
            current_date += timedelta(days=1)
        
        return slots
    
    def _distribute_sessions(
        self,
        schedule: Schedule,
        hackathon: Hackathon,
        available_slots: list[dict],
        phase_hours: dict[str, float],
    ) -> list[ScheduleSession]:
        """
        Distribute work sessions across available time slots.
        
        Sessions are allocated in order: preparation → building → submission
        """
        sessions = []
        slot_index = 0
        remaining_in_slot = 0
        current_slot_start = None
        
        for phase, hours_needed in phase_hours.items():
            hours_remaining = hours_needed
            session_number = 1
            
            while hours_remaining > 0 and slot_index < len(available_slots):
                slot = available_slots[slot_index]
                
                if remaining_in_slot <= 0:
                    remaining_in_slot = (slot["end"] - slot["start"]).total_seconds() / 3600
                    current_slot_start = slot["start"]
                
                # Determine session duration
                session_hours = min(
                    hours_remaining,
                    remaining_in_slot,
                    DEFAULT_SESSION_HOURS,
                )
                
                if session_hours <= 0:
                    slot_index += 1
                    remaining_in_slot = 0
                    continue
                
                # Create session
                session_start = current_slot_start
                session_end = session_start + timedelta(hours=session_hours)
                
                session = ScheduleSession(
                    schedule_id=schedule.id,
                    phase=phase,
                    title=f"{hackathon.name} - {phase.title()} #{session_number}",
                    description=PHASE_DESCRIPTIONS[phase],
                    start_time=session_start,
                    end_time=session_end,
                )
                sessions.append(session)
                
                # Update tracking
                hours_remaining -= session_hours
                remaining_in_slot -= session_hours
                current_slot_start = session_end
                session_number += 1
                
                if remaining_in_slot <= 0:
                    slot_index += 1
        
        return sessions
