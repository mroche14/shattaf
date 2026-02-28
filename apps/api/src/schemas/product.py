"""Product schemas."""

from decimal import Decimal
from typing import Optional
from uuid import UUID
from pydantic import BaseModel

from ..models.product import ProductCategory


class ProductCreate(BaseModel):
    """Product creation request."""

    sku: str
    name: str
    description: Optional[str] = None
    category: ProductCategory
    price_b2c: int
    price_b2b: Optional[int] = None
    vat_rate: Decimal = Decimal("8.5")
    stock_quantity: int = 0
    is_available: bool = True
    image_url: Optional[str] = None
    gallery_urls: Optional[list[str]] = None
    specifications: Optional[dict] = None
    weight_grams: Optional[int] = None
    requires_installation: bool = True
    installation_time_minutes: int = 45


class ProductUpdate(BaseModel):
    """Product update request."""

    name: Optional[str] = None
    description: Optional[str] = None
    price_b2c: Optional[int] = None
    price_b2b: Optional[int] = None
    stock_quantity: Optional[int] = None
    is_available: Optional[bool] = None
    image_url: Optional[str] = None
    gallery_urls: Optional[list[str]] = None
    specifications: Optional[dict] = None


class ProductResponse(BaseModel):
    """Product response."""

    id: UUID
    sku: str
    name: str
    description: Optional[str] = None
    category: ProductCategory
    price_b2c: int
    price_b2b: Optional[int] = None
    vat_rate: Decimal
    stock_quantity: int
    is_available: bool
    image_url: Optional[str] = None
    gallery_urls: Optional[list[str]] = None
    specifications: Optional[dict] = None
    requires_installation: bool
    installation_time_minutes: int

    class Config:
        from_attributes = True
