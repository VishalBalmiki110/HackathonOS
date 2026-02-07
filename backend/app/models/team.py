"""Team models for collaboration."""

import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, DateTime, ForeignKey, String, Text, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class TeamRole(str, Enum):
    """Team member roles."""
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"


class Team(Base):
    """Team model for hackathon collaboration."""
    
    __tablename__ = "teams"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    hackathon_id = Column(UUID(as_uuid=True), ForeignKey("hackathons.id"), nullable=True)
    invite_code = Column(String(20), unique=True)  # For joining via code
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")
    hackathon = relationship("Hackathon", backref="teams")
    
    def __repr__(self):
        return f"<Team {self.name}>"


class TeamMember(Base):
    """Team membership model."""
    
    __tablename__ = "team_members"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    role = Column(SQLEnum(TeamRole), default=TeamRole.MEMBER)
    specialization = Column(String(50))  # frontend, backend, design, etc.
    joined_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    team = relationship("Team", back_populates="members")
    user = relationship("User", backref="team_memberships")
    
    def __repr__(self):
        return f"<TeamMember {self.user_id} in {self.team_id}>"
