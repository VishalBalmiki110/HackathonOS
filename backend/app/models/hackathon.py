"""Hackathon model."""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Hackathon(Base):
    """Hackathon database model."""
    
    __tablename__ = "hackathons"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    platform = Column(String(50), nullable=False)  # devpost, mlh, unstop
    url = Column(Text, nullable=False)
    description = Column(Text)
    
    # Dates
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    submission_deadline = Column(DateTime, nullable=False)
    
    # Details
    mode = Column(String(20))  # online, in-person, hybrid
    tags = Column(ARRAY(String))
    prize_pool = Column(String(100))
    location = Column(String(255))
    image_url = Column(Text)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    schedules = relationship("Schedule", back_populates="hackathon")
    
    def __repr__(self):
        return f"<Hackathon {self.name} ({self.platform})>"
