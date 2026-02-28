"""Order model."""

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID
from sqlmodel import Field

from .base import BaseModel


class OrderStatus(str, Enum):
    """Order status."""

    PENDING_PAYMENT = "pending_payment"
    PAID = "paid"
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class PaymentStatus(str, Enum):
    """Payment status."""

    PENDING = "pending"
    AUTHORIZED = "authorized"  # Payment authorized, not captured
    CAPTURED = "captured"  # Payment captured after job completion
    FAILED = "failed"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"


class Order(BaseModel, table=True):
    """Customer order."""

    __tablename__ = "orders"

    # Order number (human readable)
    order_number: str = Field(unique=True, index=True)

    customer_id: UUID = Field(foreign_key="users.id", index=True)
    plumber_id: UUID = Field(foreign_key="users.id", index=True)
    booking_id: UUID = Field(foreign_key="bookings.id", index=True)
    quote_id: UUID = Field(foreign_key="quotes.id", index=True)

    status: OrderStatus = Field(default=OrderStatus.PENDING_PAYMENT)
    payment_status: PaymentStatus = Field(default=PaymentStatus.PENDING)

    # Pricing (in EUR cents)
    product_subtotal: int
    installation_subtotal: int
    platform_fee: int
    vat_amount: int
    total_amount: int

    # Alias properties for admin router
    @property
    def product_amount(self) -> int:
        return self.product_subtotal

    @property
    def installation_amount(self) -> int:
        return self.installation_subtotal

    # Stripe
    stripe_payment_intent_id: Optional[str] = None
    stripe_transfer_id: Optional[str] = None  # Transfer to plumber

    # Scheduling
    scheduled_date: datetime
    scheduled_time_slot: str
    actual_start_time: Optional[datetime] = None
    actual_end_time: Optional[datetime] = None

    # Completion
    completed_at: Optional[datetime] = None
    customer_rating: Optional[int] = None  # 1-5
    customer_review: Optional[str] = None


class OrderItem(BaseModel, table=True):
    """Order line item."""

    __tablename__ = "order_items"

    order_id: UUID = Field(foreign_key="orders.id", index=True)
    product_id: UUID = Field(foreign_key="products.id")

    # Snapshot at order time
    product_name: str
    product_sku: str
    unit_price: int  # Price at order time
    quantity: int = Field(default=1)
    total_price: int

    # Type
    is_installation: bool = Field(default=False)
