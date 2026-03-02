"""AI Devis schemas."""

from typing import Optional
from uuid import UUID
from pydantic import BaseModel


class AiDevisLineItem(BaseModel):
    """A single line item in an AI-generated devis."""

    description: str
    quantity: int = 1
    unit_price_cents: int  # Price per unit in cents
    item_type: str = "labor"  # "labor", "material", "travel"


class AiDevisRequest(BaseModel):
    """Request for AI devis generation."""

    booking_id: UUID
    plumber_notes: Optional[str] = None


class AiDevisResponse(BaseModel):
    """AI-generated devis draft."""

    line_items: list[AiDevisLineItem]
    subtotal_cents: int
    vat_amount_cents: int
    total_cents: int
    vat_rate: float  # e.g. 0.085 for 8.5%
    estimated_duration_minutes: int
    confidence: float  # 0.0 to 1.0
    reasoning: str  # Short explanation
