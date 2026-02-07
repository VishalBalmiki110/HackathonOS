"""Session notes and resources models."""

import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, String, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class SessionNote(Base):
    """Notes attached to a schedule session."""
    
    __tablename__ = "session_notes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("schedule_sessions.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    session = relationship("ScheduleSession", backref="notes")
    user = relationship("User", backref="session_notes")
    
    def __repr__(self):
        return f"<SessionNote {self.id[:8]}>"


class SessionResource(Base):
    """Resources/links attached to a schedule session."""
    
    __tablename__ = "session_resources"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("schedule_sessions.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    url = Column(String(500))
    resource_type = Column(String(50))  # link, document, video, code, etc.
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship("ScheduleSession", backref="resources")
    user = relationship("User", backref="session_resources")
    
    def __repr__(self):
        return f"<SessionResource {self.title}>"
