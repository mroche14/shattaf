"""Verification schemas."""

from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel

from ..models.verification import VerificationStatus


class VerificationChecklistItem(BaseModel):
    """A single checklist item."""

    item: str
    passed: bool = False
    notes: Optional[str] = None


class VerificationCreate(BaseModel):
    """Create a verification request for a mission."""

    mission_id: UUID


class VerificationAccept(BaseModel):
    """Verifier accepts the verification assignment."""

    scheduled_date: Optional[datetime] = None


class VerificationComplete(BaseModel):
    """Verifier completes the verification."""

    approved: bool
    checklist: list[VerificationChecklistItem] = []
    issues: Optional[str] = None
    verifier_notes: Optional[str] = None
    photo_urls: list[str] = []


class VerificationResponse(BaseModel):
    """Verification response."""

    id: UUID
    mission_id: UUID
    verifier_plumber_id: Optional[UUID] = None
    status: VerificationStatus
    scheduled_date: Optional[datetime] = None
    accepted_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    checklist: list[dict] = []
    photo_urls: list[str] = []
    approved: Optional[bool] = None
    issues: Optional[str] = None
    verifier_notes: Optional[str] = None
    verification_fee: int
    created_at: datetime

    class Config:
        from_attributes = True
