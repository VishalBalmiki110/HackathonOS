"""Notification models for smart alerts."""

import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, DateTime, ForeignKey, String, Text, Boolean, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class NotificationType(str, Enum):
    """Types of notifications."""
    SESSION_START = "session_start"
    SESSION_END = "session_end"
    DEADLINE_REMINDER = "deadline_reminder"
    CHECKLIST_REMINDER = "checklist_reminder"
    TEAM_UPDATE = "team_update"
    SCHEDULE_CHANGE = "schedule_change"


class NotificationPriority(str, Enum):
    """Notification priority levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class Notification(Base):
    """User notification model."""
    
    __tablename__ = "notifications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    type = Column(SQLEnum(NotificationType), nullable=False)
    priority = Column(SQLEnum(NotificationPriority), default=NotificationPriority.MEDIUM)
    title = Column(String(200), nullable=False)
    message = Column(Text)
    is_read = Column(Boolean, default=False)
    action_url = Column(String(500))  # URL to navigate when clicked
    related_id = Column(UUID(as_uuid=True))  # ID of related entity (schedule, session, etc.)
    created_at = Column(DateTime, default=datetime.utcnow)
    read_at = Column(DateTime)
    
    # Relationships
    user = relationship("User", backref="notifications")
    
    def __repr__(self):
        return f"<Notification {self.type.value}: {self.title}>"


class NotificationPreference(Base):
    """User notification preferences."""
    
    __tablename__ = "notification_preferences"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    
    # Email notifications
    email_session_reminders = Column(Boolean, default=True)
    email_deadline_reminders = Column(Boolean, default=True)
    email_team_updates = Column(Boolean, default=True)
    
    # Push/In-app notifications
    push_session_reminders = Column(Boolean, default=True)
    push_deadline_reminders = Column(Boolean, default=True)
    push_team_updates = Column(Boolean, default=True)
    
    # Timing preferences (minutes before)
    reminder_before_session = Column(DateTime, default=15)  # 15 minutes
    reminder_before_deadline = Column(DateTime, default=60)  # 1 hour
    
    # Relationships
    user = relationship("User", backref="notification_preferences")
    
    def __repr__(self):
        return f"<NotificationPreference for user {self.user_id}>"
