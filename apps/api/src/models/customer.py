"""Customer profile model."""

from typing import Optional, TYPE_CHECKING
from uuid import UUID
from sqlmodel import Field, Relationship

from .base import BaseModel

if TYPE_CHECKING:
    from .user import User


class CustomerProfile(BaseModel, table=True):
    """Customer profile with default address."""

    __tablename__ = "customer_profiles"

    user_id: UUID = Field(foreign_key="users.id", unique=True)

    # Default address
    address_street: Optional[str] = None
    address_city: Optional[str] = None
    address_postal_code: Optional[str] = None
    address_country: str = Field(default="Guadeloupe")
    address_lat: Optional[float] = None
    address_lng: Optional[float] = None

    # Access info
    floor: Optional[int] = None
    digicode: Optional[str] = None
    access_notes: Optional[str] = None

    # Stripe customer ID for payments
    stripe_customer_id: Optional[str] = None

    # Relationships
    user: Optional["User"] = Relationship(back_populates="customer_profile")

    # Alias properties for admin router
    @property
    def default_address(self) -> Optional[str]:
        return self.address_street

    @property
    def default_city(self) -> Optional[str]:
        return self.address_city

    @property
    def default_postal_code(self) -> Optional[str]:
        return self.address_postal_code
