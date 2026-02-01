"""User schemas."""

from datetime import datetime, time
from uuid import UUID
from pydantic import BaseModel, EmailStr
from typing import Optional


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    name: Optional[str] = None
    timezone: str = "UTC"
    work_hours_per_day: int = 4
    preferred_work_times: Optional[dict] = None


class UserCreate(UserBase):
    """Schema for creating a user."""
    google_id: Optional[str] = None


class UserUpdate(BaseModel):
    """Schema for updating a user."""
    name: Optional[str] = None
    timezone: Optional[str] = None
    work_hours_per_day: Optional[int] = None
    preferred_work_times: Optional[dict] = None


class UserResponse(UserBase):
    """Schema for user response."""
    id: UUID
    google_id: Optional[str] = None
    picture_url: Optional[str] = None
    google_calendar_connected: bool = False
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserAvailabilityCreate(BaseModel):
    """Schema for creating user availability."""
    day_of_week: int  # 0-6
    start_time: time
    end_time: time
    is_available: bool = True


class UserAvailabilityResponse(UserAvailabilityCreate):
    """Schema for user availability response."""
    id: UUID
    user_id: UUID
    
    class Config:
        from_attributes = True
