"""Booking schemas."""

from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel

from ..models.booking import BookingStatus, ToiletType


class BookingCreate(BaseModel):
    """Booking creation request."""

    address_street: str
    address_city: str
    address_postal_code: str
    address_lat: Optional[float] = None
    address_lng: Optional[float] = None
    floor: Optional[int] = None
    digicode: Optional[str] = None
    parking_available: bool = False
    access_notes: Optional[str] = None
    toilet_type: ToiletType = ToiletType.STANDARD
    shutoff_valve_accessible: bool = True
    additional_notes: Optional[str] = None
    product_id: Optional[UUID] = None
    preferred_date: Optional[datetime] = None
    preferred_time_slot: Optional[str] = None


class BookingUpdate(BaseModel):
    """Booking update request."""

    address_street: Optional[str] = None
    address_city: Optional[str] = None
    address_postal_code: Optional[str] = None
    address_lat: Optional[float] = None
    address_lng: Optional[float] = None
    floor: Optional[int] = None
    digicode: Optional[str] = None
    parking_available: Optional[bool] = None
    access_notes: Optional[str] = None
    toilet_type: Optional[ToiletType] = None
    shutoff_valve_accessible: Optional[bool] = None
    additional_notes: Optional[str] = None
    product_id: Optional[UUID] = None
    preferred_date: Optional[datetime] = None
    preferred_time_slot: Optional[str] = None


class BookingResponse(BaseModel):
    """Booking response."""

    id: UUID
    customer_id: UUID
    status: BookingStatus
    address_street: str
    address_city: str
    address_postal_code: str
    address_country: str
    address_lat: Optional[float] = None
    address_lng: Optional[float] = None
    floor: Optional[int] = None
    digicode: Optional[str] = None
    parking_available: bool
    access_notes: Optional[str] = None
    toilet_type: ToiletType
    shutoff_valve_accessible: bool
    additional_notes: Optional[str] = None
    photo_toilet_front_url: Optional[str] = None
    photo_toilet_side_url: Optional[str] = None
    photo_valve_url: Optional[str] = None
    additional_photo_urls: Optional[list[str]] = None
    product_id: Optional[UUID] = None
    preferred_date: Optional[datetime] = None
    preferred_time_slot: Optional[str] = None
    assigned_plumber_id: Optional[UUID] = None
    matched_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PhotoUploadResponse(BaseModel):
    """Response for photo upload presigned URL."""

    upload_url: str
    photo_url: str
    expires_in: int = 3600
