"""Plumber profile model."""

from datetime import date
from enum import Enum
from typing import Optional, List, TYPE_CHECKING
from uuid import UUID
from sqlmodel import Field, Relationship, Column, JSON

from .base import BaseModel

if TYPE_CHECKING:
    from .user import User


class PlumberStatus(str, Enum):
    """Plumber status in the platform."""

    PENDING = "pending"  # Waiting for document validation
    ACTIVE = "active"  # Validated, can receive missions
    SUSPENDED = "suspended"  # Temporarily suspended
    INACTIVE = "inactive"  # Deactivated


class Department(str, Enum):
    """French overseas departments where service is available."""

    GUADELOUPE = "971"
    MARTINIQUE = "972"
    GUYANE = "973"


class PlumberProfile(BaseModel, table=True):
    """Plumber professional profile."""

    __tablename__ = "plumber_profiles"

    user_id: UUID = Field(foreign_key="users.id", unique=True)
    status: PlumberStatus = Field(default=PlumberStatus.PENDING)

    # Department and location (stored as string code like "971", "21", etc.)
    department: Optional[str] = Field(default=None, index=True)

    # Intervention locations (list of pinned locations)
    intervention_locations: List[dict] = Field(
        default=[],
        sa_column=Column(JSON, default=[])
    )
    # Each location: {"lat": float, "lng": float, "address": str, "label": str}

    # Business information
    company_name: Optional[str] = None
    siren: Optional[str] = None
    siret: Optional[str] = None
    vat_number: Optional[str] = None

    # Insurance
    insurance_company: Optional[str] = None
    insurance_policy_number: Optional[str] = None
    insurance_expiry_date: Optional[date] = None
    insurance_document_url: Optional[str] = None

    # Qualifications
    qualification_doc_url: Optional[str] = None
    years_experience: Optional[int] = None

    # Stripe Connect
    stripe_account_id: Optional[str] = None
    stripe_onboarding_complete: bool = Field(default=False)
    stripe_charges_enabled: bool = Field(default=False)
    stripe_payouts_enabled: bool = Field(default=False)

    # Service area (center point + radius)
    service_area_lat: Optional[float] = None
    service_area_lng: Optional[float] = None
    service_area_radius_km: float = Field(default=30.0)

    # Performance
    total_missions_completed: int = Field(default=0)
    average_rating: Optional[float] = None
    total_ratings: int = Field(default=0)

    # Mandate
    mandate_signed: bool = Field(default=False)
    mandate_signed_at: Optional[date] = None
    mandate_document_url: Optional[str] = None

    # Relationships
    user: Optional["User"] = Relationship(back_populates="plumber_profile")
