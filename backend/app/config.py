"""Application configuration settings."""

from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    app_name: str = "HackathonOS"
    debug: bool = True
    
    # Database
    database_url: str = "postgresql://hackathonos:hackathonos_dev@localhost:5432/hackathonos"
    
    # Redis
    redis_url: str = "redis://localhost:6379"
    
    # Security
    secret_key: str = "dev-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    
    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/auth/google/callback"
    
    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]
    
    # Frontend URL (for OAuth redirects)
    frontend_url: str = "http://localhost:3000"
    
    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
