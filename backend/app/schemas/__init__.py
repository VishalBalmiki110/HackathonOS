"""Pydantic schemas for API validation."""

from app.schemas.hackathon import (
    HackathonBase,
    HackathonCreate,
    HackathonUpdate,
    HackathonResponse,
    HackathonList,
)
from app.schemas.user import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserResponse,
    UserAvailabilityCreate,
    UserAvailabilityResponse,
)
from app.schemas.schedule import (
    ScheduleBase,
    ScheduleCreate,
    ScheduleResponse,
    ScheduleSessionResponse,
)
from app.schemas.auth import Token, TokenData, GoogleAuthRequest

__all__ = [
    "HackathonBase",
    "HackathonCreate", 
    "HackathonUpdate",
    "HackathonResponse",
    "HackathonList",
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserAvailabilityCreate",
    "UserAvailabilityResponse",
    "ScheduleBase",
    "ScheduleCreate",
    "ScheduleResponse",
    "ScheduleSessionResponse",
    "Token",
    "TokenData",
    "GoogleAuthRequest",
]
