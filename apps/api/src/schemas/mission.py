"""Mission schemas."""

from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel

from ..models.mission import MissionStatus


class MissionCheckin(BaseModel):
    """Plumber check-in at mission location."""

    lat: float
    lng: float


class MissionPhotoUpload(BaseModel):
    """Mission photo upload request."""

    photo_type: str  # "before", "during", "after", "issue"
    caption: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None


class MissionSignature(BaseModel):
    """Customer signature capture."""

    signature_image_base64: str
    signature_name: str


class MissionComplete(BaseModel):
    """Mission completion by plumber."""

    plumber_notes: Optional[str] = None
    issues_reported: Optional[str] = None


class MissionPhotoResponse(BaseModel):
    """Mission photo response."""

    id: UUID
    photo_url: str
    photo_type: str
    caption: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    taken_at: datetime

    class Config:
        from_attributes = True


class MissionResponse(BaseModel):
    """Mission response."""

    id: UUID
    order_id: UUID
    plumber_id: UUID
    status: MissionStatus
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
