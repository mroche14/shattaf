"""Booking model."""

from datetime import datetime
from enum import Enum
from typing import Optional, List
from uuid import UUID
from sqlmodel import Field, Column, JSON

from .base import BaseModel


class BookingStatus(str, Enum):
    """Booking status."""

    DRAFT = "draft"  # Photos being uploaded
    SUBMITTED = "submitted"  # Waiting for plumber matching
    QUOTED = "quoted"  # Quote received from plumber
    ACCEPTED = "accepted"  # Customer accepted quote
    EXPIRED = "expired"  # No response within timeout


class ToiletType(str, Enum):
    """Type of toilet installation."""

    STANDARD = "standard"  # Posé au sol standard
    WALL_HUNG = "wall_hung"  # Suspendu (encastré)


class Booking(BaseModel, table=True):
    """Customer booking request."""

    __tablename__ = "bookings"

    customer_id: UUID = Field(foreign_key="users.id", index=True)
    status: BookingStatus = Field(default=BookingStatus.DRAFT)

    # Location
    address_street: str
    address_city: str
    address_postal_code: str
    address_country: str = Field(default="Guadeloupe")
    address_lat: Optional[float] = None
    address_lng: Optional[float] = None

    # Access information
    floor: Optional[int] = None
    digicode: Optional[str] = None
    parking_available: bool = Field(default=False)
    access_notes: Optional[str] = None

    # Toilet information
    toilet_type: ToiletType = Field(default=ToiletType.STANDARD)
    shutoff_valve_accessible: bool = Field(default=True)
    additional_notes: Optional[str] = None

    # Photos (S3 URLs)
    photo_toilet_front_url: Optional[str] = None
    photo_toilet_side_url: Optional[str] = None
    photo_valve_url: Optional[str] = None
    additional_photo_urls: List[str] = Field(default=[], sa_column=Column(JSON, default=[]))

    # Product selection
    product_id: Optional[UUID] = Field(default=None, foreign_key="products.id")

    # Preferred scheduling
    preferred_date: Optional[datetime] = None
    preferred_time_slot: Optional[str] = None  # "morning", "afternoon", "evening"

    # Matching
    assigned_plumber_id: Optional[UUID] = Field(default=None, foreign_key="users.id")
    matched_at: Optional[datetime] = None
    quote_deadline: Optional[datetime] = None

    # Alias properties for admin router compatibility
    @property
    def lat(self) -> Optional[float]:
        return self.address_lat

    @property
    def lng(self) -> Optional[float]:
        return self.address_lng

    @property
    def has_shutoff_valve(self) -> bool:
        return self.shutoff_valve_accessible

    @property
    def photo_urls(self) -> List[str]:
        urls = []
        if self.photo_toilet_front_url:
            urls.append(self.photo_toilet_front_url)
        if self.photo_toilet_side_url:
            urls.append(self.photo_toilet_side_url)
        if self.photo_valve_url:
            urls.append(self.photo_valve_url)
        urls.extend(self.additional_photo_urls or [])
        return urls
