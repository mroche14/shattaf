"""Job (mission) model."""

from datetime import datetime
from enum import Enum
from typing import Optional, List
from uuid import UUID
from sqlmodel import Field, Column, JSON

from .base import BaseModel


class JobStatus(str, Enum):
    """Job status."""

    SCHEDULED = "scheduled"
    EN_ROUTE = "en_route"  # Plumber on the way
    CHECKED_IN = "checked_in"  # Plumber arrived
    IN_PROGRESS = "in_progress"  # Work started
    PENDING_SIGNATURE = "pending_signature"  # Work done, waiting signature
    COMPLETED = "completed"  # Signed and done
    CANCELLED = "cancelled"


class Job(BaseModel, table=True):
    """Field job/mission for plumber."""

    __tablename__ = "jobs"

    order_id: UUID = Field(foreign_key="orders.id", unique=True, index=True)
    plumber_id: UUID = Field(foreign_key="users.id", index=True)
    status: JobStatus = Field(default=JobStatus.SCHEDULED)

    # Scheduling
    scheduled_date: datetime = Field(default_factory=datetime.utcnow)

    # Check-in
    checkin_time: Optional[datetime] = None
    checkin_lat: Optional[float] = None
    checkin_lng: Optional[float] = None
    checkin_distance_meters: Optional[int] = None  # Distance from job location

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


class JobPhoto(BaseModel, table=True):
    """Photo taken during job execution."""

    __tablename__ = "job_photos"

    job_id: UUID = Field(foreign_key="jobs.id", index=True)

    photo_url: str
    photo_type: str  # "before", "during", "after", "issue"
    caption: Optional[str] = None

    # GPS metadata
    lat: Optional[float] = None
    lng: Optional[float] = None
    taken_at: datetime = Field(default_factory=datetime.utcnow)
