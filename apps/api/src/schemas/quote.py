"""Quote schemas."""

from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel

from ..models.quote import QuoteStatus


class QuoteCreate(BaseModel):
    """Quote creation by plumber."""

    booking_id: UUID
    installation_price: int  # Plumber sets their price
    proposed_date: datetime
    proposed_time_slot: str  # "morning", "afternoon", "evening"
    estimated_duration_minutes: int = 45
    plumber_notes: Optional[str] = None


class QuoteResponse(BaseModel):
    """Quote response."""

    id: UUID
    booking_id: UUID
    plumber_id: UUID
    status: QuoteStatus
    installation_price: int
    product_price: int
    platform_fee: int
    total_price: int
    vat_amount: int
    price_excluding_vat: int
    proposed_date: datetime
    proposed_time_slot: str
    estimated_duration_minutes: int
    valid_until: datetime
    plumber_notes: Optional[str] = None
    customer_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class QuoteAccept(BaseModel):
    """Customer accepting a quote."""

    customer_notes: Optional[str] = None
