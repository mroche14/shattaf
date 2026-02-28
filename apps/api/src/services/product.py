"""Product service."""

from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from ..models import Product, ProductCategory
from ..utils.db import uuid_column_eq


class ProductService:
    """Product catalog service."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_products(
        self,
        category: Optional[ProductCategory] = None,
        available_only: bool = True,
    ) -> list[Product]:
        """Get products with optional filters."""
        query = select(Product)

        if category:
            query = query.where(Product.category == category)
        if available_only:
            query = query.where(Product.is_available == True)

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_product(self, product_id: UUID) -> Optional[Product]:
        """Get product by ID."""
        result = await self.session.execute(
            select(Product).where(uuid_column_eq(Product.id, product_id))
        )
        return result.scalar_one_or_none()

    async def get_product_by_sku(self, sku: str) -> Optional[Product]:
        """Get product by SKU."""
        result = await self.session.execute(
            select(Product).where(Product.sku == sku)
        )
        return result.scalar_one_or_none()

    async def create_product(self, **kwargs) -> Product:
        """Create a new product."""
        product = Product(**kwargs)
        self.session.add(product)
        await self.session.commit()
        await self.session.refresh(product)
        return product

    async def update_product(
        self,
        product_id: UUID,
        **kwargs,
    ) -> Optional[Product]:
        """Update a product."""
        product = await self.get_product(product_id)
        if not product:
            return None

        for key, value in kwargs.items():
            if value is not None and hasattr(product, key):
                setattr(product, key, value)

        await self.session.commit()
        await self.session.refresh(product)
        return product

    async def delete_product(self, product_id: UUID) -> bool:
        """Delete a product."""
        product = await self.get_product(product_id)
        if not product:
            return False

        await self.session.delete(product)
        await self.session.commit()
        return True
