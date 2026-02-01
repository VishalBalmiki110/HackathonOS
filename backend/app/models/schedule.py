"""Schedule models."""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Schedule(Base):
    """Schedule for a user's hackathon participation."""
    
    __tablename__ = "schedules"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    hackathon_id = Column(UUID(as_uuid=True), ForeignKey("hackathons.id"), nullable=False)
    
    status = Column(String(20), default="draft")  # draft, active, completed, cancelled
    total_hours = Column(Float)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="schedules")
    hackathon = relationship("Hackathon", back_populates="schedules")
    sessions = relationship("ScheduleSession", back_populates="schedule", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint("user_id", "hackathon_id", name="uq_user_hackathon"),
    )
    
    def __repr__(self):
        return f"<Schedule {self.user_id} - {self.hackathon_id}>"


class ScheduleSession(Base):
    """Individual work session within a schedule."""
    
    __tablename__ = "schedule_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    schedule_id = Column(UUID(as_uuid=True), ForeignKey("schedules.id"), nullable=False)
    
    phase = Column(String(20), nullable=False)  # preparation, building, submission
    title = Column(String(255))
    description = Column(String(500))
    
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    
    # Calendar integration
    calendar_event_id = Column(String(255))  # External calendar event ID
    is_synced = Column(Boolean, default=False)
    
    # Relationships
    schedule = relationship("Schedule", back_populates="sessions")
    
    def __repr__(self):
        return f"<ScheduleSession {self.phase} {self.start_time}>"
    
    @property
    def duration_hours(self) -> float:
        """Calculate session duration in hours."""
        delta = self.end_time - self.start_time
        return delta.total_seconds() / 3600
