"""Submission checklist models."""

import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, String, Text, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class SubmissionChecklist(Base):
    """Checklist for hackathon submission requirements."""
    
    __tablename__ = "submission_checklists"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    schedule_id = Column(UUID(as_uuid=True), ForeignKey("schedules.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    schedule = relationship("Schedule", backref="checklist")
    items = relationship("ChecklistItem", back_populates="checklist", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<SubmissionChecklist for schedule {self.schedule_id}>"


class ChecklistItem(Base):
    """Individual item in a submission checklist."""
    
    __tablename__ = "checklist_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    checklist_id = Column(UUID(as_uuid=True), ForeignKey("submission_checklists.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    is_completed = Column(Boolean, default=False)
    is_required = Column(Boolean, default=True)
    category = Column(String(50))  # demo, code, documentation, video, etc.
    order = Column(Integer, default=0)
    completed_at = Column(DateTime)
    
    # Relationships
    checklist = relationship("SubmissionChecklist", back_populates="items")
    
    def __repr__(self):
        return f"<ChecklistItem {self.title}>"


# Default checklist items for new hackathons
DEFAULT_CHECKLIST_ITEMS = [
    {"title": "Project Repository", "category": "code", "is_required": True, "description": "GitHub/GitLab repo with source code"},
    {"title": "README Documentation", "category": "documentation", "is_required": True, "description": "Clear README with setup instructions"},
    {"title": "Demo Video", "category": "demo", "is_required": True, "description": "2-3 minute video showing the project"},
    {"title": "Live Demo URL", "category": "demo", "is_required": False, "description": "Deployed application link"},
    {"title": "Presentation Slides", "category": "documentation", "is_required": False, "description": "Pitch deck or slides"},
    {"title": "Team Info", "category": "documentation", "is_required": True, "description": "Team member names and roles"},
    {"title": "Screenshots", "category": "demo", "is_required": False, "description": "App screenshots for submission"},
    {"title": "API Documentation", "category": "documentation", "is_required": False, "description": "API docs if applicable"},
]
