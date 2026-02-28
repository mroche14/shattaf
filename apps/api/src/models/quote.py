"""Quote model."""

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID
from sqlmodel import Field

from .base import BaseModel


class QuoteStatus(str, Enum):
    """Quote status."""

    PENDING = "pending"  # Waiting for customer response
    ACCEPTED = "accepted"  # Customer accepted
    REJECTED = "rejected"  # Customer rejected
    EXPIRED = "expired"  # Timeout expired
    CANCELLED = "cancelled"  # Plumber cancelled


class Quote(BaseModel, table=True):
    """Quote from plumber to customer."""

    __tablename__ = "quotes"

    booking_id: UUID = Field(foreign_key="bookings.id", index=True)
    plumber_id: UUID = Field(foreign_key="users.id", index=True)
    status: QuoteStatus = Field(default=QuoteStatus.PENDING)

    # Pricing (in EUR cents)
    installation_price: int  # Plumber's installation fee
    product_price: int  # Product price (from catalog)
    platform_fee: int  # Platform commission
    total_price: int  # Total customer pays

    # Breakdown for transparency
    vat_amount: int = Field(default=0)
    price_excluding_vat: int = Field(default=0)

    # Scheduling
    proposed_date: datetime
    proposed_time_slot: str  # "morning", "afternoon", "evening"
    estimated_duration_minutes: int = Field(default=45)

    # Quote validity
    valid_until: datetime
    customer_response_at: Optional[datetime] = None

    # Notes
    plumber_notes: Optional[str] = None
    customer_notes: Optional[str] = None
