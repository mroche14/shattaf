"""Orders router."""

from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..models import User, UserRole, OrderStatus
from ..schemas import OrderResponse, OrderItemResponse
from ..services.order import OrderService
from ..utils.deps import get_current_active_user

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/from-quote/{quote_id}", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order_from_quote(
    quote_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Create an order from an accepted quote."""
    if current_user.role != UserRole.CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can create orders",
        )

    service = OrderService(session)
    order = await service.create_order_from_quote(quote_id)

    if not order:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create order. Quote must be accepted.",
        )

    return order


@router.get("", response_model=list[OrderResponse])
async def list_orders(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    status_filter: Optional[OrderStatus] = None,
) -> list:
    """List orders for current user."""
    service = OrderService(session)

    if current_user.role == UserRole.CUSTOMER:
        return await service.get_customer_orders(
            customer_id=current_user.id,
            status=status_filter,
        )
    elif current_user.role == UserRole.PLUMBER:
        return await service.get_plumber_orders(
            plumber_id=current_user.id,
            status=status_filter,
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Get an order."""
    service = OrderService(session)
    order = await service.get_order(order_id)

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    # Verify access
    if current_user.role == UserRole.CUSTOMER and order.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    if current_user.role == UserRole.PLUMBER and order.plumber_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    return order


@router.get("/{order_id}/items", response_model=list[OrderItemResponse])
async def get_order_items(
    order_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list:
    """Get order items."""
    service = OrderService(session)
    order = await service.get_order(order_id)

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    # Verify access
    if order.customer_id != current_user.id and order.plumber_id != current_user.id:
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )

    return await service.get_order_items(order_id)


@router.post("/{order_id}/rate")
async def rate_order(
    order_id: UUID,
    rating: int,
    review: Optional[str] = None,
    current_user: Annotated[User, Depends(get_current_active_user)] = None,
    session: Annotated[AsyncSession, Depends(get_session)] = None,
):
    """Rate a completed order (customer only)."""
    if current_user.role != UserRole.CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can rate orders",
        )

    if rating < 1 or rating > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rating must be between 1 and 5",
        )

    service = OrderService(session)
    order = await service.get_order(order_id)

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    if order.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    if order.status != OrderStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only rate completed orders",
        )

    await service.complete_order(order_id, rating=rating, review=review)
    return {"message": "Rating submitted"}
