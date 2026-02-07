"""Bookmark model."""

import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Bookmark(Base):
    """User's bookmarked hackathons."""
    
    __tablename__ = "bookmarks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    hackathon_id = Column(UUID(as_uuid=True), ForeignKey("hackathons.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Unique constraint: user can only bookmark a hackathon once
    __table_args__ = (
        UniqueConstraint('user_id', 'hackathon_id', name='unique_user_hackathon_bookmark'),
    )
    
    # Relationships
    user = relationship("User", backref="bookmarks")
    hackathon = relationship("Hackathon", backref="bookmarks")
    
    def __repr__(self):
        return f"<Bookmark {self.user_id} -> {self.hackathon_id}>"
