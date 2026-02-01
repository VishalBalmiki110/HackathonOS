"""Schedule schemas."""

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from typing import Optional

from app.schemas.hackathon import HackathonResponse


class ScheduleSessionResponse(BaseModel):
    """Schema for schedule session response."""
    id: UUID
    phase: str
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    duration_hours: float
    is_synced: bool = False
    calendar_event_id: Optional[str] = None
    
    class Config:
        from_attributes = True


class ScheduleBase(BaseModel):
    """Base schedule schema."""
    hackathon_id: UUID
    

class ScheduleCreate(ScheduleBase):
    """Schema for creating a schedule."""
    start_from: Optional[datetime] = None  # When to start scheduling from


class ScheduleResponse(BaseModel):
    """Schema for schedule response."""
    id: UUID
    user_id: UUID
    hackathon_id: UUID
    status: str
    total_hours: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    
    # Nested
    hackathon: Optional[HackathonResponse] = None
    sessions: list[ScheduleSessionResponse] = []
    
    # Computed
    preparation_hours: Optional[float] = None
    building_hours: Optional[float] = None
    submission_hours: Optional[float] = None
    
    class Config:
        from_attributes = True


class ScheduleList(BaseModel):
    """List of user schedules."""
    items: list[ScheduleResponse]
    total: int
