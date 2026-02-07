"""User routes."""

import os
import uuid as uuid_lib
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User, UserAvailability
from app.schemas.user import (
    UserUpdate,
    UserResponse,
    UserAvailabilityCreate,
    UserAvailabilityResponse,
)
from app.routers.auth import get_current_user

router = APIRouter()

# Create uploads directory
UPLOAD_DIR = "/app/uploads/avatars"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a profile photo."""
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed: {', '.join(allowed_types)}"
        )
    
    # Validate file size (max 5MB)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 5MB.")
    
    # Generate unique filename
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    filename = f"{current_user.id}_{uuid_lib.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    # Save file
    with open(filepath, "wb") as f:
        f.write(contents)
    
    # Update user's picture_url
    current_user.picture_url = f"/api/users/avatar/{filename}"
    await db.commit()
    await db.refresh(current_user)
    
    return {"picture_url": current_user.picture_url}


@router.get("/avatar/{filename}")
async def get_avatar(filename: str):
    """Serve avatar image."""
    filepath = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Avatar not found")
    return FileResponse(filepath)


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    """Get the current user's profile."""
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's profile."""
    update_data = user_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(current_user, key, value)
    
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.get("/me/availability", response_model=list[UserAvailabilityResponse])
async def get_user_availability(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's availability slots."""
    result = await db.execute(
        select(UserAvailability)
        .where(UserAvailability.user_id == current_user.id)
        .order_by(UserAvailability.day_of_week, UserAvailability.start_time)
    )
    return result.scalars().all()


@router.post("/me/availability", response_model=UserAvailabilityResponse)
async def create_availability(
    availability: UserAvailabilityCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new availability slot for the current user."""
    # Validate day of week
    if availability.day_of_week < 0 or availability.day_of_week > 6:
        raise HTTPException(
            status_code=400,
            detail="day_of_week must be between 0 (Monday) and 6 (Sunday)",
        )
    
    # Validate times
    if availability.start_time >= availability.end_time:
        raise HTTPException(
            status_code=400,
            detail="start_time must be before end_time",
        )
    
    db_availability = UserAvailability(
        user_id=current_user.id,
        **availability.model_dump(),
    )
    db.add(db_availability)
    await db.commit()
    await db.refresh(db_availability)
    return db_availability


@router.put("/me/availability", response_model=list[UserAvailabilityResponse])
async def set_availability(
    availability_list: list[UserAvailabilityCreate],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Replace all availability slots for the current user.
    
    Useful for bulk updates from a UI calendar picker.
    """
    # Delete existing availability
    result = await db.execute(
        select(UserAvailability).where(UserAvailability.user_id == current_user.id)
    )
    existing = result.scalars().all()
    for slot in existing:
        await db.delete(slot)
    
    # Create new availability slots
    new_slots = []
    for availability in availability_list:
        db_availability = UserAvailability(
            user_id=current_user.id,
            **availability.model_dump(),
        )
        db.add(db_availability)
        new_slots.append(db_availability)
    
    await db.commit()
    
    # Refresh all
    for slot in new_slots:
        await db.refresh(slot)
    
    return new_slots


@router.delete("/me/availability/{availability_id}")
async def delete_availability(
    availability_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an availability slot."""
    result = await db.execute(
        select(UserAvailability).where(
            UserAvailability.id == availability_id,
            UserAvailability.user_id == current_user.id,
        )
    )
    availability = result.scalar_one_or_none()
    
    if not availability:
        raise HTTPException(status_code=404, detail="Availability slot not found")
    
    await db.delete(availability)
    await db.commit()
    
    return {"status": "deleted"}
