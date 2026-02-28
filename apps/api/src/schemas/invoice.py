"""Invoice schemas."""

from datetime import date, datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel

from ..models.invoice import InvoiceStatus


class InvoiceItemResponse(BaseModel):
    """Invoice item response."""

    id: UUID
    section: str  # "A" or "B"
    description: str
    quantity: int
    unit_price: int
    vat_rate: str
    vat_amount: int
    total_amount: int
    plumber_siren: Optional[str] = None

    class Config:
        from_attributes = True


class InvoiceResponse(BaseModel):
    """Invoice response."""

    id: UUID
    invoice_number: str
    order_id: UUID
    status: InvoiceStatus
    issuer_name: str
    issuer_siren: str
    issuer_address: str
    customer_id: UUID
    customer_name: str
    customer_address: str
    customer_email: str
    plumber_id: UUID
    plumber_name: str
    plumber_siren: str
    invoice_date: date
    due_date: date
    paid_date: Optional[date] = None
    subtotal_products: int
    subtotal_installation: int
    vat_products: int
    vat_installation: int
    total_excluding_vat: int
    total_vat: int
    total_amount: int
    vat_rate: str
    mandate_mention: str
    pdf_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
