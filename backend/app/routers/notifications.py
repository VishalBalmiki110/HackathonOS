"""Notifications API routes."""

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.notification import Notification, NotificationPreference, NotificationType, NotificationPriority
from app.routers.auth import get_current_user

router = APIRouter()


# Pydantic schemas
class NotificationResponse(BaseModel):
    id: UUID
    type: str
    priority: str
    title: str
    message: Optional[str]
    is_read: bool
    action_url: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class PreferencesUpdate(BaseModel):
    email_session_reminders: Optional[bool] = None
    email_deadline_reminders: Optional[bool] = None
    email_team_updates: Optional[bool] = None
    push_session_reminders: Optional[bool] = None
    push_deadline_reminders: Optional[bool] = None
    push_team_updates: Optional[bool] = None


@router.get("/")
async def get_notifications(
    unread_only: bool = False,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get user notifications."""
    query = select(Notification).where(Notification.user_id == current_user.id)
    
    if unread_only:
        query = query.where(Notification.is_read == False)
    
    query = query.order_by(Notification.created_at.desc()).limit(limit)
    
    result = await db.execute(query)
    notifications = result.scalars().all()
    
    # Get unread count
    count_result = await db.execute(
        select(func.count(Notification.id))
        .where(Notification.user_id == current_user.id, Notification.is_read == False)
    )
    unread_count = count_result.scalar()
    
    return {
        "notifications": [
            {
                "id": str(n.id),
                "type": n.type.value,
                "priority": n.priority.value,
                "title": n.title,
                "message": n.message,
                "is_read": n.is_read,
                "action_url": n.action_url,
                "created_at": n.created_at.isoformat(),
            }
            for n in notifications
        ],
        "unread_count": unread_count,
    }


@router.post("/{notification_id}/read")
async def mark_as_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a notification as read."""
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
    )
    notification = result.scalar_one_or_none()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    notification.read_at = datetime.utcnow()
    await db.commit()
    
    return {"status": "read"}


@router.post("/read-all")
async def mark_all_as_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark all notifications as read."""
    result = await db.execute(
        select(Notification).where(
            Notification.user_id == current_user.id,
            Notification.is_read == False,
        )
    )
    notifications = result.scalars().all()
    
    for notification in notifications:
        notification.is_read = True
        notification.read_at = datetime.utcnow()
    
    await db.commit()
    
    return {"status": "all_read", "count": len(notifications)}


@router.get("/preferences")
async def get_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get notification preferences."""
    result = await db.execute(
        select(NotificationPreference).where(NotificationPreference.user_id == current_user.id)
    )
    prefs = result.scalar_one_or_none()
    
    # Create default preferences if not exists
    if not prefs:
        prefs = NotificationPreference(user_id=current_user.id)
        db.add(prefs)
        await db.commit()
        await db.refresh(prefs)
    
    return {
        "email_session_reminders": prefs.email_session_reminders,
        "email_deadline_reminders": prefs.email_deadline_reminders,
        "email_team_updates": prefs.email_team_updates,
        "push_session_reminders": prefs.push_session_reminders,
        "push_deadline_reminders": prefs.push_deadline_reminders,
        "push_team_updates": prefs.push_team_updates,
    }


@router.patch("/preferences")
async def update_preferences(
    prefs_data: PreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update notification preferences."""
    result = await db.execute(
        select(NotificationPreference).where(NotificationPreference.user_id == current_user.id)
    )
    prefs = result.scalar_one_or_none()
    
    if not prefs:
        prefs = NotificationPreference(user_id=current_user.id)
        db.add(prefs)
    
    for field, value in prefs_data.model_dump(exclude_unset=True).items():
        setattr(prefs, field, value)
    
    await db.commit()
    await db.refresh(prefs)
    
    return {
        "status": "updated",
        "preferences": {
            "email_session_reminders": prefs.email_session_reminders,
            "email_deadline_reminders": prefs.email_deadline_reminders,
            "email_team_updates": prefs.email_team_updates,
            "push_session_reminders": prefs.push_session_reminders,
            "push_deadline_reminders": prefs.push_deadline_reminders,
            "push_team_updates": prefs.push_team_updates,
        }
    }


# Helper function to create notifications (used by other services)
async def create_notification(
    db: AsyncSession,
    user_id: UUID,
    notification_type: NotificationType,
    title: str,
    message: str = None,
    priority: NotificationPriority = NotificationPriority.MEDIUM,
    action_url: str = None,
    related_id: UUID = None,
):
    """Create a notification for a user."""
    notification = Notification(
        user_id=user_id,
        type=notification_type,
        priority=priority,
        title=title,
        message=message,
        action_url=action_url,
        related_id=related_id,
    )
    db.add(notification)
    await db.commit()
    return notification
