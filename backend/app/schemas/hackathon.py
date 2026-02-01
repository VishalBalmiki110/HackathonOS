"""Hackathon schemas."""

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, HttpUrl
from typing import Optional


class HackathonBase(BaseModel):
    """Base hackathon schema."""
    name: str
    platform: str
    url: str
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    submission_deadline: datetime
    mode: Optional[str] = None
    tags: Optional[list[str]] = None
    prize_pool: Optional[str] = None
    location: Optional[str] = None
    image_url: Optional[str] = None


class HackathonCreate(HackathonBase):
    """Schema for creating a hackathon."""
    pass


class HackathonUpdate(BaseModel):
    """Schema for updating a hackathon."""
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    submission_deadline: Optional[datetime] = None
    mode: Optional[str] = None
    tags: Optional[list[str]] = None
    prize_pool: Optional[str] = None
    location: Optional[str] = None
    image_url: Optional[str] = None


class HackathonResponse(HackathonBase):
    """Schema for hackathon response."""
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    # Computed fields
    days_until_deadline: Optional[int] = None
    
    class Config:
        from_attributes = True


class HackathonList(BaseModel):
    """Paginated list of hackathons."""
    items: list[HackathonResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
