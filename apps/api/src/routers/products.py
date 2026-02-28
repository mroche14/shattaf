"""Products router."""

from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..models import User, UserRole, ProductCategory
from ..schemas import ProductResponse, ProductCreate, ProductUpdate
from ..services.product import ProductService
from ..utils.deps import get_current_active_user

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=list[ProductResponse])
async def list_products(
    session: Annotated[AsyncSession, Depends(get_session)],
    category: Optional[ProductCategory] = None,
    available_only: bool = True,
) -> list:
    """List all products."""
    service = ProductService(session)
    return await service.get_products(category=category, available_only=available_only)


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Get a single product."""
    service = ProductService(session)
    product = await service.get_product(product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    return product


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    data: ProductCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Create a new product (admin only)."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    service = ProductService(session)

    # Check if SKU already exists
    existing = await service.get_product_by_sku(data.sku)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SKU already exists",
        )

    return await service.create_product(**data.model_dump())


@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: UUID,
    data: ProductUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Update a product (admin only)."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    service = ProductService(session)
    product = await service.update_product(
        product_id,
        **data.model_dump(exclude_unset=True),
    )
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Delete a product (admin only)."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    service = ProductService(session)
    deleted = await service.delete_product(product_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
