"""Support ticket model."""

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID
from sqlmodel import Field

from .base import BaseModel


class TicketStatus(str, Enum):
    """Ticket status."""

    OPEN = "open"
    IN_PROGRESS = "in_progress"
    WAITING_CUSTOMER = "waiting_customer"
    WAITING_PLUMBER = "waiting_plumber"
    RESOLVED = "resolved"
    CLOSED = "closed"


class TicketCategory(str, Enum):
    """Ticket category."""

    PRODUCT_DEFECT = "product_defect"
    INSTALLATION_ISSUE = "installation_issue"
    BILLING = "billing"
    SCHEDULING = "scheduling"
    OTHER = "other"


class SupportTicket(BaseModel, table=True):
    """Customer support ticket."""

    __tablename__ = "support_tickets"

    ticket_number: str = Field(unique=True, index=True)
    order_id: Optional[UUID] = Field(default=None, foreign_key="orders.id")

    customer_id: UUID = Field(foreign_key="users.id", index=True)
    plumber_id: Optional[UUID] = Field(default=None, foreign_key="users.id")

    status: TicketStatus = Field(default=TicketStatus.OPEN)
    category: TicketCategory
    priority: int = Field(default=2)  # 1=urgent, 2=normal, 3=low

    subject: str
    description: str

    # Responsibility
    is_product_issue: bool = Field(default=False)
    is_installation_issue: bool = Field(default=False)

    # Resolution
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None

    # Assignee (admin)
    assigned_to_id: Optional[UUID] = Field(default=None, foreign_key="users.id")
