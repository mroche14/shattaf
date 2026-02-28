"""Mandate model for billing/collection authorization."""

from datetime import date
from enum import Enum
from typing import Optional
from uuid import UUID
from sqlmodel import Field

from .base import BaseModel


class MandateStatus(str, Enum):
    """Mandate status."""

    PENDING = "pending"
    SENT = "sent"
    SIGNED = "signed"
    EXPIRED = "expired"
    REVOKED = "revoked"


class Mandate(BaseModel, table=True):
    """Billing/collection mandate from plumber to platform."""

    __tablename__ = "mandates"

    plumber_id: UUID = Field(foreign_key="users.id", index=True)
    status: MandateStatus = Field(default=MandateStatus.PENDING)

    # Mandate type
    mandate_type: str  # "billing" (facturation), "collection" (encaissement)

    # Dates
    start_date: date
    end_date: Optional[date] = None  # Null = indefinite

    # Signature
    signed_at: Optional[date] = None
    signature_method: Optional[str] = None  # "electronic", "paper"
    yousign_signature_id: Optional[str] = None

    # Document
    document_url: Optional[str] = None
    signed_document_url: Optional[str] = None

    # Legal
    terms_version: str = "1.0"
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
