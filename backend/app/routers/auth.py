"""Authentication routes."""

from datetime import datetime, timedelta
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import JWTError, jwt

from app.config import get_settings
from app.database import get_db
from app.models.user import User
from app.schemas.auth import Token, TokenData, GoogleAuthRequest
from app.schemas.user import UserResponse

router = APIRouter()
settings = get_settings()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token", auto_error=False)


def create_access_token(data: dict) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Get the current authenticated user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        raise credentials_exception
    
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(user_id=UUID(user_id))
    except JWTError:
        raise credentials_exception
    
    result = await db.execute(select(User).where(User.id == token_data.user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
    
    return user


async def get_optional_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """Get the current user if authenticated, otherwise None."""
    if not token:
        return None
    try:
        return await get_current_user(token, db)
    except HTTPException:
        return None


@router.post("/google", response_model=Token)
async def google_auth(
    request: GoogleAuthRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticate with Google OAuth.
    
    Exchange authorization code for user info and create/update user.
    """
    import httpx
    
    # Exchange code for tokens
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": request.code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": request.redirect_uri or settings.google_redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        
        if token_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to exchange authorization code",
            )
        
        tokens = token_response.json()
        
        # Get user info
        userinfo_response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
        
        if userinfo_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get user info",
            )
        
        userinfo = userinfo_response.json()
    
    # Find or create user
    result = await db.execute(
        select(User).where(User.google_id == userinfo["id"])
    )
    user = result.scalar_one_or_none()
    
    if not user:
        # Check if user exists by email
        result = await db.execute(
            select(User).where(User.email == userinfo["email"])
        )
        user = result.scalar_one_or_none()
        
        if user:
            # Link Google account
            user.google_id = userinfo["id"]
            user.picture_url = userinfo.get("picture")
        else:
            # Create new user
            user = User(
                email=userinfo["email"],
                name=userinfo.get("name"),
                google_id=userinfo["id"],
                picture_url=userinfo.get("picture"),
            )
            db.add(user)
    
    # Store refresh token if provided (for calendar access)
    if "refresh_token" in tokens:
        user.google_calendar_refresh_token = tokens["refresh_token"]
        user.google_calendar_connected = True
    
    await db.commit()
    await db.refresh(user)
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return Token(access_token=access_token)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get the current authenticated user."""
    return current_user


@router.get("/google/url")
async def get_google_auth_url():
    """Get the Google OAuth authorization URL."""
    from urllib.parse import urlencode
    
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile https://www.googleapis.com/auth/calendar.events",
        "access_type": "offline",
        "prompt": "consent",
    }
    
    return {
        "url": f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    }
