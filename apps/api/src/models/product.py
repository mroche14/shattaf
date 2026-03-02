"""Product model."""

from decimal import Decimal
from enum import Enum
from typing import Optional, List
from uuid import UUID
from sqlmodel import Field, Column, JSON

from .base import BaseModel


class ProductCategory(str, Enum):
    """Product categories."""

    SHATTAF = "shattaf"
    KIT = "kit"
    ACCESSORY = "accessory"


class Product(BaseModel, table=True):
    """Product in catalog."""

    __tablename__ = "products"

    # Project link
    project_id: Optional[UUID] = Field(default=None, foreign_key="projects.id", index=True)

    sku: str = Field(unique=True, index=True)
    name: str
    description: Optional[str] = None
    category: ProductCategory

    # Pricing (in EUR cents)
    supplier_price: int = Field(default=0)  # Prix fournisseur (coût d'achat)
    price_b2c: int  # Consumer price (calculé ou fixé)
    price_b2b: Optional[int] = None  # Pro price

    # Tax
    vat_rate: Decimal = Field(default=Decimal("8.5"))  # Guadeloupe TVA

    # Stock
    stock_quantity: int = Field(default=0)
    is_available: bool = Field(default=True)

    # Media
    image_url: Optional[str] = None
    gallery_urls: List[str] = Field(default=[], sa_column=Column(JSON, default=[]))

    # Specs
    specifications: Optional[dict] = Field(default=None, sa_column=Column(JSON, nullable=True))

    # Weight for shipping (grams)
    weight_grams: Optional[int] = None

    # Installation
    requires_installation: bool = Field(default=True)
    installation_time_minutes: int = Field(default=45)
    installation_price: int = Field(default=5000)  # Default 50 EUR

    # Alias properties for admin router
    @property
    def slug(self) -> str:
        return self.sku

    @property
    def is_active(self) -> bool:
        return self.is_available
