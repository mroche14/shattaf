"""Verification model — peer quality check by a different plumber."""

from datetime import datetime
from enum import Enum
from typing import Optional, List
from uuid import UUID
from sqlmodel import Field, Column, JSON

from .base import BaseModel


class VerificationStatus(str, Enum):
    """Verification lifecycle status."""

    PENDING = "pending"          # Waiting for a verifier to accept
    ACCEPTED = "accepted"        # Verifier accepted the assignment
    IN_PROGRESS = "in_progress"  # Verifier is on-site checking
    APPROVED = "approved"        # Work quality validated
    REJECTED = "rejected"        # Quality issues found
    CANCELLED = "cancelled"


class Verification(BaseModel, table=True):
    """Post-mission quality check by a different plumber."""

    __tablename__ = "verifications"

    mission_id: UUID = Field(foreign_key="missions.id", unique=True, index=True)
    verifier_plumber_id: Optional[UUID] = Field(
        default=None, foreign_key="users.id", index=True
    )
    status: VerificationStatus = Field(default=VerificationStatus.PENDING)

    # Scheduling
    scheduled_date: Optional[datetime] = None
    accepted_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    # Checklist (JSON: list of {item: str, passed: bool, notes: str})
    checklist: List[dict] = Field(default=[], sa_column=Column(JSON, default=[]))

    # Photos
    photo_urls: List[str] = Field(default=[], sa_column=Column(JSON, default=[]))

    # Result
    approved: Optional[bool] = None
    issues: Optional[str] = None
    verifier_notes: Optional[str] = None

    # Payment
    verification_fee: int = Field(default=2000)  # 20.00 EUR in cents
