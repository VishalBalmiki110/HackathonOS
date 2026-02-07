"""Session notes and resources API routes."""

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.session_notes import SessionNote, SessionResource
from app.models.schedule import ScheduleSession
from app.routers.auth import get_current_user

router = APIRouter()


# Pydantic schemas
class NoteCreate(BaseModel):
    content: str


class NoteUpdate(BaseModel):
    content: str


class NoteResponse(BaseModel):
    id: UUID
    session_id: UUID
    content: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ResourceCreate(BaseModel):
    title: str
    url: Optional[str] = None
    resource_type: Optional[str] = "link"
    description: Optional[str] = None


class ResourceResponse(BaseModel):
    id: UUID
    session_id: UUID
    title: str
    url: Optional[str]
    resource_type: Optional[str]
    description: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


# Notes endpoints
@router.post("/sessions/{session_id}/notes", response_model=NoteResponse)
async def create_note(
    session_id: UUID,
    note_data: NoteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a note to a session."""
    # Verify session exists
    result = await db.execute(select(ScheduleSession).where(ScheduleSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    note = SessionNote(
        session_id=session_id,
        user_id=current_user.id,
        content=note_data.content,
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    
    return note


@router.get("/sessions/{session_id}/notes", response_model=list[NoteResponse])
async def get_session_notes(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all notes for a session."""
    result = await db.execute(
        select(SessionNote)
        .where(SessionNote.session_id == session_id)
        .order_by(SessionNote.created_at.desc())
    )
    return result.scalars().all()


@router.put("/notes/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: UUID,
    note_data: NoteUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a note."""
    result = await db.execute(
        select(SessionNote).where(
            SessionNote.id == note_id,
            SessionNote.user_id == current_user.id,
        )
    )
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    note.content = note_data.content
    note.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(note)
    
    return note


@router.delete("/notes/{note_id}")
async def delete_note(
    note_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a note."""
    result = await db.execute(
        select(SessionNote).where(
            SessionNote.id == note_id,
            SessionNote.user_id == current_user.id,
        )
    )
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    await db.delete(note)
    await db.commit()
    
    return {"status": "deleted"}


# Resources endpoints
@router.post("/sessions/{session_id}/resources", response_model=ResourceResponse)
async def create_resource(
    session_id: UUID,
    resource_data: ResourceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a resource to a session."""
    result = await db.execute(select(ScheduleSession).where(ScheduleSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    resource = SessionResource(
        session_id=session_id,
        user_id=current_user.id,
        title=resource_data.title,
        url=resource_data.url,
        resource_type=resource_data.resource_type,
        description=resource_data.description,
    )
    db.add(resource)
    await db.commit()
    await db.refresh(resource)
    
    return resource


@router.get("/sessions/{session_id}/resources", response_model=list[ResourceResponse])
async def get_session_resources(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all resources for a session."""
    result = await db.execute(
        select(SessionResource)
        .where(SessionResource.session_id == session_id)
        .order_by(SessionResource.created_at.desc())
    )
    return result.scalars().all()


@router.delete("/resources/{resource_id}")
async def delete_resource(
    resource_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a resource."""
    result = await db.execute(
        select(SessionResource).where(
            SessionResource.id == resource_id,
            SessionResource.user_id == current_user.id,
        )
    )
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    await db.delete(resource)
    await db.commit()
    
    return {"status": "deleted"}
