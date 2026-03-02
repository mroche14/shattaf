"""Dead zone result cache model."""

from datetime import datetime, timedelta
from typing import Any, Optional

from sqlmodel import Column, Field, JSON

from .base import BaseModel


class DeadZoneCache(BaseModel, table=True):
    """Caches computed dead zone results to avoid repeated API calls."""

    __tablename__ = "dead_zone_cache"

    cache_key: str = Field(index=True, unique=True)
    department: str
    mode: str  # "distance" | "time"
    threshold: float
    source_type: str  # "plumbers" | "prospects" | "both"
    point_count: int = 0
    plumber_count: int = 0
    geojson: Optional[Any] = Field(default=None, sa_column=Column(JSON))
    stats: Any = Field(default=None, sa_column=Column(JSON))
    provider: Optional[str] = None
    compute_duration_ms: int = 0
    expires_at: datetime = Field(
        default_factory=lambda: datetime.utcnow() + timedelta(days=30)
    )
