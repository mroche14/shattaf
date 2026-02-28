"""Application configuration using pydantic-settings."""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Application
    APP_NAME: str = "Shattaf Marketplace API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8010

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///data/shattaf_dev.db"
    USE_SQLITE_FALLBACK: bool = False  # Not needed when using SQLite directly

    # JWT Authentication
    JWT_SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3003", "http://localhost:3001", "http://localhost:3002", "http://localhost:5173", "http://localhost:5174"]

    # Stripe
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PLATFORM_FEE_PERCENT: float = 15.0

    # Google Maps
    GOOGLE_MAPS_API_KEY: str = ""

    # Brevo (Email/SMS)
    BREVO_API_KEY: str = ""
    BREVO_SENDER_EMAIL: str = "noreply@oasis-shattaf.com"
    BREVO_SENDER_NAME: str = "Oasis Shattaf"

    # S3/R2 Storage
    S3_ENDPOINT_URL: str = ""
    S3_ACCESS_KEY_ID: str = ""
    S3_SECRET_ACCESS_KEY: str = ""
    S3_BUCKET_NAME: str = "shattaf-uploads"
    S3_PUBLIC_URL: str = ""

    # Guadeloupe Zone (971)
    SERVICE_ZONE_POSTAL_PREFIX: str = "971"
    SERVICE_ZONE_COORDS_CENTER: tuple[float, float] = (16.265, -61.551)
    SERVICE_ZONE_RADIUS_KM: float = 100.0


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
