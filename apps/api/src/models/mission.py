"""Mission model."""

from datetime import datetime
from enum import Enum
from typing import Optional, List
from uuid import UUID
from sqlmodel import Field, Column, JSON

from .base import BaseModel


class MissionStatus(str, Enum):
    """Mission status."""

    SCHEDULED = "scheduled"
    EN_ROUTE = "en_route"  # Plumber on the way
    CHECKED_IN = "checked_in"  # Plumber arrived
    IN_PROGRESS = "in_progress"  # Work started
    PENDING_SIGNATURE = "pending_signature"  # Work done, waiting signature
    PENDING_VERIFICATION = "pending_verification"  # Awaiting peer verification
    COMPLETED = "completed"  # Signed and done
    CANCELLED = "cancelled"


class Mission(BaseModel, table=True):
    """Field mission for plumber."""

    __tablename__ = "missions"

    order_id: UUID = Field(foreign_key="orders.id", unique=True, index=True)
    plumber_id: UUID = Field(foreign_key="users.id", index=True)
    status: MissionStatus = Field(default=MissionStatus.SCHEDULED)

    # Scheduling
    scheduled_date: datetime = Field(default_factory=datetime.utcnow)

    # Check-in
    checkin_time: Optional[datetime] = None
    checkin_lat: Optional[float] = None
    checkin_lng: Optional[float] = None
    checkin_distance_meters: Optional[int] = None  # Distance from mission location

    # Work tracking
    start_time: Optional[datetime] = None
    work_started_at: Optional[datetime] = None
    work_completed_at: Optional[datetime] = None

    # Photos
    photo_before_urls: List[str] = Field(default=[], sa_column=Column(JSON, default=[]))
    photo_after_urls: List[str] = Field(default=[], sa_column=Column(JSON, default=[]))

    # Customer signature
    signature_image_url: Optional[str] = None
    signature_name: str = ""
    signature_timestamp: Optional[datetime] = None

    # Completion
    completed_at: Optional[datetime] = None

    # Notes
    plumber_notes: Optional[str] = None
    issues_reported: Optional[str] = None

    # QR code for inventory (V2)
    inventory_qr_scanned: bool = Field(default=False)
    inventory_unit_id: Optional[UUID] = None


class MissionPhoto(BaseModel, table=True):
    """Photo taken during mission execution."""

    __tablename__ = "mission_photos"

    mission_id: UUID = Field(foreign_key="missions.id", index=True)

    photo_url: str
    photo_type: str  # "before", "during", "after", "issue"
    caption: Optional[str] = None

    # GPS metadata
    lat: Optional[float] = None
    lng: Optional[float] = None
    taken_at: datetime = Field(default_factory=datetime.utcnow)
