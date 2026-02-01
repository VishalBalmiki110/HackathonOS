"""Authentication schemas."""

from uuid import UUID
from pydantic import BaseModel
from typing import Optional


class Token(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token payload data."""
    user_id: Optional[UUID] = None
    email: Optional[str] = None


class GoogleAuthRequest(BaseModel):
    """Google OAuth authorization code request."""
    code: str
    redirect_uri: Optional[str] = None
