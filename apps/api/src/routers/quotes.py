"""Quotes router."""

from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..models import User, UserRole, QuoteStatus
from ..schemas import QuoteCreate, QuoteResponse, QuoteAccept
from ..services.quote import QuoteService
from ..services.booking import BookingService
from ..utils.deps import get_current_active_user

router = APIRouter(prefix="/quotes", tags=["Quotes"])


@router.post("", response_model=QuoteResponse, status_code=status.HTTP_201_CREATED)
async def create_quote(
    data: QuoteCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Create a quote for a booking (plumber only)."""
    if current_user.role != UserRole.PLUMBER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only plumbers can create quotes",
        )

    # Verify booking is assigned to this plumber
    booking_service = BookingService(session)
    booking = await booking_service.get_booking(data.booking_id)

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    if booking.assigned_plumber_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Booking not assigned to you",
        )

    service = QuoteService(session)
    quote = await service.create_quote(
        booking_id=data.booking_id,
        plumber_id=current_user.id,
        installation_price=data.installation_price,
        proposed_date=data.proposed_date,
        proposed_time_slot=data.proposed_time_slot,
        estimated_duration_minutes=data.estimated_duration_minutes,
        plumber_notes=data.plumber_notes,
    )

    if not quote:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create quote",
        )

    return quote


@router.get("/plumber", response_model=list[QuoteResponse])
async def list_plumber_quotes(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    status_filter: Optional[QuoteStatus] = None,
) -> list:
    """List quotes created by current plumber."""
    if current_user.role != UserRole.PLUMBER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only plumbers can view their quotes",
        )

    service = QuoteService(session)
    return await service.get_plumber_quotes(
        plumber_id=current_user.id,
        status=status_filter,
    )


@router.get("/booking/{booking_id}", response_model=list[QuoteResponse])
async def list_booking_quotes(
    booking_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list:
    """List quotes for a booking."""
    # Verify access to booking
    booking_service = BookingService(session)
    booking = await booking_service.get_booking(booking_id)

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    if current_user.role == UserRole.CUSTOMER and booking.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    service = QuoteService(session)
    return await service.get_booking_quotes(booking_id)


@router.get("/{quote_id}", response_model=QuoteResponse)
async def get_quote(
    quote_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Get a quote."""
    service = QuoteService(session)
    quote = await service.get_quote(quote_id)

    if not quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quote not found",
        )

    # Verify access
    booking_service = BookingService(session)
    booking = await booking_service.get_booking(quote.booking_id)

    if current_user.role == UserRole.CUSTOMER and booking.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    if current_user.role == UserRole.PLUMBER and quote.plumber_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    return quote


@router.post("/{quote_id}/accept", response_model=QuoteResponse)
async def accept_quote(
    quote_id: UUID,
    data: QuoteAccept,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Accept a quote (customer only)."""
    if current_user.role != UserRole.CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can accept quotes",
        )

    service = QuoteService(session)
    quote = await service.get_quote(quote_id)

    if not quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quote not found",
        )

    # Verify customer owns the booking
    booking_service = BookingService(session)
    booking = await booking_service.get_booking(quote.booking_id)

    if booking.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    result = await service.accept_quote(quote_id, data.customer_notes)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quote expired or already processed",
        )

    return result


@router.post("/{quote_id}/reject", response_model=QuoteResponse)
async def reject_quote(
    quote_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Reject a quote (customer only)."""
    if current_user.role != UserRole.CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can reject quotes",
        )

    service = QuoteService(session)
    quote = await service.get_quote(quote_id)

    if not quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quote not found",
        )

    # Verify customer owns the booking
    booking_service = BookingService(session)
    booking = await booking_service.get_booking(quote.booking_id)

    if booking.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    result = await service.reject_quote(quote_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quote already processed",
        )

    return result
