"""Submission checklist API routes."""

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
from app.models.schedule import Schedule
from app.models.checklist import SubmissionChecklist, ChecklistItem, DEFAULT_CHECKLIST_ITEMS
from app.routers.auth import get_current_user

router = APIRouter()


# Pydantic schemas
class ChecklistItemCreate(BaseModel):
    title: str
    description: Optional[str] = None
    is_required: bool = True
    category: Optional[str] = None


class ChecklistItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_completed: Optional[bool] = None
    is_required: Optional[bool] = None
    category: Optional[str] = None


class ChecklistItemResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    is_completed: bool
    is_required: bool
    category: Optional[str]
    order: int
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class ChecklistResponse(BaseModel):
    id: UUID
    schedule_id: UUID
    items: list[ChecklistItemResponse]
    total_items: int
    completed_items: int
    required_completed: int
    required_total: int
    progress_percent: int
    
    class Config:
        from_attributes = True


@router.get("/schedules/{schedule_id}/checklist")
async def get_or_create_checklist(
    schedule_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get or create submission checklist for a schedule."""
    # Verify schedule exists and belongs to user
    result = await db.execute(
        select(Schedule).where(Schedule.id == schedule_id)
    )
    schedule = result.scalar_one_or_none()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    # Check for existing checklist
    result = await db.execute(
        select(SubmissionChecklist)
        .where(SubmissionChecklist.schedule_id == schedule_id)
        .options(selectinload(SubmissionChecklist.items))
    )
    checklist = result.scalar_one_or_none()
    
    # Create if not exists
    if not checklist:
        checklist = SubmissionChecklist(schedule_id=schedule_id)
        db.add(checklist)
        await db.flush()
        
        # Add default items
        for i, item_data in enumerate(DEFAULT_CHECKLIST_ITEMS):
            item = ChecklistItem(
                checklist_id=checklist.id,
                title=item_data["title"],
                description=item_data.get("description"),
                is_required=item_data.get("is_required", True),
                category=item_data.get("category"),
                order=i,
            )
            db.add(item)
        
        await db.commit()
        
        # Refresh to get items
        result = await db.execute(
            select(SubmissionChecklist)
            .where(SubmissionChecklist.id == checklist.id)
            .options(selectinload(SubmissionChecklist.items))
        )
        checklist = result.scalar_one()
    
    # Calculate progress
    items = sorted(checklist.items, key=lambda x: x.order)
    completed = sum(1 for item in items if item.is_completed)
    required_items = [item for item in items if item.is_required]
    required_completed = sum(1 for item in required_items if item.is_completed)
    
    return {
        "id": str(checklist.id),
        "schedule_id": str(checklist.schedule_id),
        "items": [
            {
                "id": str(item.id),
                "title": item.title,
                "description": item.description,
                "is_completed": item.is_completed,
                "is_required": item.is_required,
                "category": item.category,
                "order": item.order,
                "completed_at": item.completed_at.isoformat() if item.completed_at else None,
            }
            for item in items
        ],
        "total_items": len(items),
        "completed_items": completed,
        "required_completed": required_completed,
        "required_total": len(required_items),
        "progress_percent": round((completed / len(items)) * 100) if items else 0,
    }


@router.post("/checklists/{checklist_id}/items", response_model=ChecklistItemResponse)
async def add_checklist_item(
    checklist_id: UUID,
    item_data: ChecklistItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a custom item to checklist."""
    result = await db.execute(
        select(SubmissionChecklist)
        .where(SubmissionChecklist.id == checklist_id)
        .options(selectinload(SubmissionChecklist.items))
    )
    checklist = result.scalar_one_or_none()
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")
    
    max_order = max((item.order for item in checklist.items), default=-1)
    
    item = ChecklistItem(
        checklist_id=checklist_id,
        title=item_data.title,
        description=item_data.description,
        is_required=item_data.is_required,
        category=item_data.category,
        order=max_order + 1,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    
    return item


@router.patch("/checklist-items/{item_id}")
async def update_checklist_item(
    item_id: UUID,
    item_data: ChecklistItemUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a checklist item."""
    result = await db.execute(
        select(ChecklistItem).where(ChecklistItem.id == item_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if item_data.title is not None:
        item.title = item_data.title
    if item_data.description is not None:
        item.description = item_data.description
    if item_data.is_required is not None:
        item.is_required = item_data.is_required
    if item_data.category is not None:
        item.category = item_data.category
    if item_data.is_completed is not None:
        item.is_completed = item_data.is_completed
        item.completed_at = datetime.utcnow() if item_data.is_completed else None
    
    await db.commit()
    await db.refresh(item)
    
    return {
        "id": str(item.id),
        "title": item.title,
        "description": item.description,
        "is_completed": item.is_completed,
        "is_required": item.is_required,
        "category": item.category,
        "order": item.order,
        "completed_at": item.completed_at.isoformat() if item.completed_at else None,
    }


@router.delete("/checklist-items/{item_id}")
async def delete_checklist_item(
    item_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a checklist item."""
    result = await db.execute(
        select(ChecklistItem).where(ChecklistItem.id == item_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    await db.delete(item)
    await db.commit()
    
    return {"status": "deleted"}
