"""Job schemas."""

from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel

from ..models.job import JobStatus


class JobCheckin(BaseModel):
    """Plumber check-in at job location."""

    lat: float
    lng: float


class JobPhotoUpload(BaseModel):
    """Job photo upload request."""

    photo_type: str  # "before", "during", "after", "issue"
    caption: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None


class JobSignature(BaseModel):
    """Customer signature capture."""

    signature_image_base64: str
    signature_name: str


class JobComplete(BaseModel):
    """Job completion by plumber."""

    plumber_notes: Optional[str] = None
    issues_reported: Optional[str] = None


class JobPhotoResponse(BaseModel):
    """Job photo response."""

    id: UUID
    photo_url: str
    photo_type: str
    caption: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    taken_at: datetime

    class Config:
        from_attributes = True


class JobResponse(BaseModel):
    """Job response."""

    id: UUID
    order_id: UUID
    plumber_id: UUID
    status: JobStatus
    checkin_time: Optional[datetime] = None
    checkin_lat: Optional[float] = None
    checkin_lng: Optional[float] = None
    checkin_distance_meters: Optional[int] = None
    work_started_at: Optional[datetime] = None
    work_completed_at: Optional[datetime] = None
    signature_image_url: Optional[str] = None
    signature_name: str
    signature_timestamp: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    plumber_notes: Optional[str] = None
    issues_reported: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
