"""User models."""

import uuid
from datetime import datetime, time
from sqlalchemy import Column, String, Integer, Boolean, Time, DateTime, ForeignKey, JSON, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    """User database model."""
    
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255))
    google_id = Column(String(100), unique=True, index=True)
    picture_url = Column(Text, nullable=True)
    
    # Preferences
    timezone = Column(String(50), default="UTC")
    work_hours_per_day = Column(Integer, default=4)
    preferred_work_times = Column(JSON)  # {"weekday": "evening", "weekend": "morning"}
    
    # Google Calendar
    google_calendar_refresh_token = Column(Text)
    google_calendar_connected = Column(Boolean, default=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    availability = relationship("UserAvailability", back_populates="user", cascade="all, delete-orphan")
    schedules = relationship("Schedule", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User {self.email}>"


class UserAvailability(Base):
    """User availability slots for scheduling."""
    
    __tablename__ = "user_availability"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_available = Column(Boolean, default=True)
    
    # Relationships
    user = relationship("User", back_populates="availability")
    
    def __repr__(self):
        return f"<UserAvailability {self.day_of_week} {self.start_time}-{self.end_time}>"
