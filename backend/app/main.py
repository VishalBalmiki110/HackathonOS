"""FastAPI application entry point."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
from app.routers import (
    hackathons, users, schedules, calendar, auth, bookmarks, 
    teams, notes, checklist, notifications, export, timezone
)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    await init_db()
    yield
    # Shutdown


app = FastAPI(
    title=settings.app_name,
    description="Turn hackathon deadlines into execution plans.",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(hackathons.router, prefix="/api/hackathons", tags=["Hackathons"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(schedules.router, prefix="/api/schedules", tags=["Schedules"])
app.include_router(calendar.router, prefix="/api/calendar", tags=["Calendar"])
app.include_router(bookmarks.router, prefix="/api/bookmarks", tags=["Bookmarks"])
app.include_router(teams.router, prefix="/api/teams", tags=["Teams"])
app.include_router(notes.router, prefix="/api/notes", tags=["Session Notes"])
app.include_router(checklist.router, prefix="/api/checklist", tags=["Submission Checklist"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(export.router, prefix="/api/export", tags=["Export"])
app.include_router(timezone.router, prefix="/api/timezone", tags=["Timezone"])


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "name": settings.app_name,
        "status": "running",
        "message": "Turn hackathon deadlines into execution plans.",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
