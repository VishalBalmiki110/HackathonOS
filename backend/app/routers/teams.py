"""Team collaboration routes."""

import secrets
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.team import Team, TeamMember, TeamRole
from app.routers.auth import get_current_user

router = APIRouter()


# Pydantic schemas
class TeamCreate(BaseModel):
    name: str
    description: Optional[str] = None
    hackathon_id: Optional[UUID] = None


class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class TeamMemberResponse(BaseModel):
    id: UUID
    user_id: UUID
    user_name: Optional[str]
    user_email: str
    role: str
    specialization: Optional[str]
    joined_at: datetime
    
    class Config:
        from_attributes = True


class TeamResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    hackathon_id: Optional[UUID]
    invite_code: str
    created_at: datetime
    member_count: int
    
    class Config:
        from_attributes = True


# Helpers
def generate_invite_code() -> str:
    """Generate a random 8-character invite code."""
    return secrets.token_urlsafe(6)[:8].upper()


@router.post("/", response_model=TeamResponse)
async def create_team(
    team_data: TeamCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new team (creator becomes owner)."""
    team = Team(
        name=team_data.name,
        description=team_data.description,
        hackathon_id=team_data.hackathon_id,
        invite_code=generate_invite_code(),
    )
    db.add(team)
    await db.flush()
    
    # Add creator as owner
    member = TeamMember(
        team_id=team.id,
        user_id=current_user.id,
        role=TeamRole.OWNER,
    )
    db.add(member)
    await db.commit()
    await db.refresh(team)
    
    return TeamResponse(
        id=team.id,
        name=team.name,
        description=team.description,
        hackathon_id=team.hackathon_id,
        invite_code=team.invite_code,
        created_at=team.created_at,
        member_count=1,
    )


@router.get("/", response_model=list[TeamResponse])
async def get_my_teams(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all teams the current user is a member of."""
    result = await db.execute(
        select(Team)
        .join(TeamMember, TeamMember.team_id == Team.id)
        .where(TeamMember.user_id == current_user.id)
        .options(selectinload(Team.members))
    )
    teams = result.scalars().all()
    
    return [
        TeamResponse(
            id=team.id,
            name=team.name,
            description=team.description,
            hackathon_id=team.hackathon_id,
            invite_code=team.invite_code,
            created_at=team.created_at,
            member_count=len(team.members),
        )
        for team in teams
    ]


@router.get("/{team_id}")
async def get_team(
    team_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get team details with members."""
    result = await db.execute(
        select(Team)
        .where(Team.id == team_id)
        .options(selectinload(Team.members).selectinload(TeamMember.user))
    )
    team = result.scalar_one_or_none()
    
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Check if user is a member
    is_member = any(m.user_id == current_user.id for m in team.members)
    if not is_member:
        raise HTTPException(status_code=403, detail="Not a member of this team")
    
    members = [
        TeamMemberResponse(
            id=m.id,
            user_id=m.user_id,
            user_name=m.user.name,
            user_email=m.user.email,
            role=m.role.value,
            specialization=m.specialization,
            joined_at=m.joined_at,
        )
        for m in team.members
    ]
    
    return {
        "id": str(team.id),
        "name": team.name,
        "description": team.description,
        "hackathon_id": str(team.hackathon_id) if team.hackathon_id else None,
        "invite_code": team.invite_code,
        "created_at": team.created_at.isoformat(),
        "members": members,
    }


@router.post("/join/{invite_code}")
async def join_team(
    invite_code: str,
    specialization: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Join a team using an invite code."""
    result = await db.execute(
        select(Team).where(Team.invite_code == invite_code.upper())
    )
    team = result.scalar_one_or_none()
    
    if not team:
        raise HTTPException(status_code=404, detail="Invalid invite code")
    
    # Check if already a member
    result = await db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team.id,
            TeamMember.user_id == current_user.id,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        return {"status": "already_member", "team_id": str(team.id)}
    
    # Add as member
    member = TeamMember(
        team_id=team.id,
        user_id=current_user.id,
        role=TeamRole.MEMBER,
        specialization=specialization,
    )
    db.add(member)
    await db.commit()
    
    return {"status": "joined", "team_id": str(team.id), "team_name": team.name}


@router.delete("/{team_id}/leave")
async def leave_team(
    team_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Leave a team."""
    result = await db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.user_id == current_user.id,
        )
    )
    member = result.scalar_one_or_none()
    
    if not member:
        raise HTTPException(status_code=404, detail="Not a member of this team")
    
    if member.role == TeamRole.OWNER:
        raise HTTPException(status_code=400, detail="Owner cannot leave. Transfer ownership first.")
    
    await db.delete(member)
    await db.commit()
    
    return {"status": "left"}


@router.patch("/{team_id}/members/{member_id}/role")
async def update_member_role(
    team_id: UUID,
    member_id: UUID,
    new_role: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a member's role (owner/admin only)."""
    # Check if current user is owner or admin
    result = await db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.user_id == current_user.id,
        )
    )
    current_member = result.scalar_one_or_none()
    
    if not current_member or current_member.role not in [TeamRole.OWNER, TeamRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only owner or admin can update roles")
    
    # Get target member
    result = await db.execute(
        select(TeamMember).where(TeamMember.id == member_id)
    )
    target = result.scalar_one_or_none()
    
    if not target:
        raise HTTPException(status_code=404, detail="Member not found")
    
    try:
        target.role = TeamRole(new_role)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    await db.commit()
    
    return {"status": "updated", "new_role": new_role}
