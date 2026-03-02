"""User schemas."""

from datetime import date
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr

from ..models.user import UserRole
from ..models.plumber import PlumberStatus, Department


def to_camel(string: str) -> str:
    """Convert snake_case to camelCase."""
    components = string.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])


class InterventionLocation(BaseModel):
    """Intervention location."""
    lat: float
    lng: float
    address: str
    label: str


class UserResponse(BaseModel):
    """User response."""

    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: UUID
    email: EmailStr
    phone: str
    first_name: str
    last_name: str
    role: UserRole
    is_active: bool
    is_verified: bool
    avatar_url: Optional[str] = None


class UserUpdate(BaseModel):
    """User update request."""

    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


class CustomerProfileCreate(BaseModel):
    """Customer profile creation."""

    address_street: Optional[str] = None
    address_city: Optional[str] = None
    address_postal_code: Optional[str] = None
    floor: Optional[int] = None
    digicode: Optional[str] = None
    access_notes: Optional[str] = None


class CustomerProfileResponse(BaseModel):
    """Customer profile response."""

    id: UUID
    user_id: UUID
    address_street: Optional[str] = None
    address_city: Optional[str] = None
    address_postal_code: Optional[str] = None
    address_country: str
    address_lat: Optional[float] = None
    address_lng: Optional[float] = None
    floor: Optional[int] = None
    digicode: Optional[str] = None
    access_notes: Optional[str] = None

    class Config:
        from_attributes = True


class PlumberProfileCreate(BaseModel):
    """Plumber profile creation."""

    company_name: Optional[str] = None
    siren: Optional[str] = None
    siret: Optional[str] = None
    vat_number: Optional[str] = None
    insurance_company: Optional[str] = None
    insurance_policy_number: Optional[str] = None
    insurance_expiry_date: Optional[date] = None
    years_experience: Optional[int] = None
    department: Optional[str] = None
    service_area_lat: Optional[float] = None
    service_area_lng: Optional[float] = None
    service_area_radius_km: float = 30.0


class PlumberProfileResponse(BaseModel):
    """Plumber profile response."""

    id: UUID
    user_id: UUID
    status: PlumberStatus
    department: Optional[Department] = None
    company_name: Optional[str] = None
    siren: Optional[str] = None
    siret: Optional[str] = None
    service_area_lat: Optional[float] = None
    service_area_lng: Optional[float] = None
    service_area_radius_km: float
    intervention_locations: List[InterventionLocation] = []
    stripe_onboarding_complete: bool
    stripe_charges_enabled: bool
    stripe_payouts_enabled: bool
    total_missions_completed: int
    average_rating: Optional[float] = None
    total_ratings: int
    mandate_signed: bool

    class Config:
        from_attributes = True


class AddInterventionLocationRequest(BaseModel):
    """Request to add an intervention location."""
    lat: float
    lng: float
    address: str
    label: str
