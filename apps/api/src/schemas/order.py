"""Order schemas."""

from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel

from ..models.order import OrderStatus, PaymentStatus


class OrderItemResponse(BaseModel):
    """Order item response."""

    id: UUID
    product_id: Optional[UUID] = None
    product_name: str
    product_sku: str
    unit_price: int
    quantity: int
    total_price: int
    is_installation: bool

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    """Order response."""

    id: UUID
    order_number: str
    customer_id: UUID
    plumber_id: UUID
    booking_id: UUID
    quote_id: UUID
    status: OrderStatus
    payment_status: PaymentStatus
    product_subtotal: int
    installation_subtotal: int
    platform_fee: int
    vat_amount: int
    total_amount: int
    scheduled_date: datetime
    scheduled_time_slot: str
    actual_start_time: Optional[datetime] = None
    actual_end_time: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    customer_rating: Optional[int] = None
    customer_review: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
