"""Payments router (Stripe)."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..models import User, UserRole, PaymentStatus
from ..services.order import OrderService
from ..integrations.stripe import StripeService
from ..utils.deps import get_current_active_user

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/orders/{order_id}/create-intent")
async def create_payment_intent(
    order_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Create Stripe PaymentIntent for an order."""
    if current_user.role != UserRole.CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can pay for orders",
        )

    order_service = OrderService(session)
    order = await order_service.get_order(order_id)

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

    if order.stripe_payment_intent_id:
        # Return existing PaymentIntent
        stripe_service = StripeService()
        intent = await stripe_service.get_payment_intent(order.stripe_payment_intent_id)
        return {
            "client_secret": intent.client_secret,
            "payment_intent_id": intent.id,
        }

    # Create new PaymentIntent
    stripe_service = StripeService()
    intent = await stripe_service.create_payment_intent(
        amount=order.total_amount,
        currency="eur",
        order_id=str(order.id),
        customer_id=str(current_user.id),
        plumber_stripe_account_id=None,  # Would get from plumber profile
        platform_fee=order.platform_fee,
    )

    # Update order with PaymentIntent ID
    await order_service.update_payment_status(
        order_id,
        PaymentStatus.PENDING,
        stripe_payment_intent_id=intent.id,
    )

    return {
        "client_secret": intent.client_secret,
        "payment_intent_id": intent.id,
    }


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Handle Stripe webhook events."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    stripe_service = StripeService()
    event = stripe_service.verify_webhook(payload, sig_header)

    if not event:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook signature",
        )

    # Handle event types
    if event.type == "payment_intent.succeeded":
        payment_intent = event.data.object
        order_id = payment_intent.metadata.get("order_id")

        if order_id:
            order_service = OrderService(session)
            await order_service.update_payment_status(
                UUID(order_id),
                PaymentStatus.AUTHORIZED,
            )

    elif event.type == "payment_intent.payment_failed":
        payment_intent = event.data.object
        order_id = payment_intent.metadata.get("order_id")

        if order_id:
            order_service = OrderService(session)
            await order_service.update_payment_status(
                UUID(order_id),
                PaymentStatus.FAILED,
            )

    return {"status": "ok"}


@router.post("/orders/{order_id}/capture")
async def capture_payment(
    order_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Capture authorized payment after job completion (admin only)."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    order_service = OrderService(session)
    order = await order_service.get_order(order_id)

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    if order.payment_status != PaymentStatus.AUTHORIZED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment must be authorized before capture",
        )

    stripe_service = StripeService()
    success = await stripe_service.capture_payment(order.stripe_payment_intent_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to capture payment",
        )

    await order_service.update_payment_status(order_id, PaymentStatus.CAPTURED)

    return {"status": "captured"}
