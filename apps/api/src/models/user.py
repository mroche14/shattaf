"""User model."""

from enum import Enum
from typing import Optional
from sqlmodel import Field, Relationship

from .base import BaseModel


class UserRole(str, Enum):
    """User roles."""

    CUSTOMER = "customer"
    PLUMBER = "plumber"
    ADMIN = "admin"


class User(BaseModel, table=True):
    """User account model."""

    __tablename__ = "users"

    email: str = Field(unique=True, index=True)
    phone: str = Field(unique=True, index=True)
    hashed_password: str
    first_name: str
    last_name: str
    role: UserRole = Field(default=UserRole.CUSTOMER)
    is_active: bool = Field(default=True)
    is_verified: bool = Field(default=False)
    avatar_url: Optional[str] = None

    # Relationships
    customer_profile: Optional["CustomerProfile"] = Relationship(back_populates="user")
    plumber_profile: Optional["PlumberProfile"] = Relationship(back_populates="user")

    @property
    def full_name(self) -> str:
        """Get full name."""
        return f"{self.first_name} {self.last_name}"


# Import for type hints (avoid circular imports)
from .customer import CustomerProfile  # noqa: E402
from .plumber import PlumberProfile  # noqa: E402
