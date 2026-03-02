"""Bookings router."""

from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..models import User, UserRole, BookingType, BookingStatus
from ..schemas import BookingCreate, BookingUpdate, BookingResponse, PhotoUploadResponse
from ..services.booking import BookingService
from ..integrations.storage import StorageService
from ..utils.deps import get_current_active_user

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(
    data: BookingCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Create a new booking.

    Product bookings require product_id.
    Marketplace bookings require category + description.
    """
    if current_user.role != UserRole.CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can create bookings",
        )

    # Validate based on booking type
    if data.type == BookingType.MARKETPLACE:
        if not data.category or not data.description:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Marketplace bookings require category and description",
            )
    else:
        if not data.product_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product bookings require a product_id",
            )

    service = BookingService(session)
    return await service.create_booking(
        customer_id=current_user.id,
        **data.model_dump(),
    )


@router.get("", response_model=list[BookingResponse])
async def list_bookings(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    status_filter: Optional[BookingStatus] = None,
) -> list:
    """List user's bookings."""
    if current_user.role != UserRole.CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can view their bookings",
        )

    service = BookingService(session)
    return await service.get_customer_bookings(
        customer_id=current_user.id,
        status=status_filter,
    )


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(
    booking_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Get a booking."""
    service = BookingService(session)
    booking = await service.get_booking(booking_id)

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    # Customers can only see their own bookings
    if current_user.role == UserRole.CUSTOMER and booking.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    return booking


@router.patch("/{booking_id}", response_model=BookingResponse)
async def update_booking(
    booking_id: UUID,
    data: BookingUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Update a booking."""
    service = BookingService(session)
    booking = await service.get_booking(booking_id)

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    if booking.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    if booking.status != BookingStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only update draft bookings",
        )

    return await service.update_booking(
        booking_id,
        **data.model_dump(exclude_unset=True),
    )


@router.post("/{booking_id}/photos/upload-url", response_model=PhotoUploadResponse)
async def get_photo_upload_url(
    booking_id: UUID,
    photo_type: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Get presigned URL for photo upload."""
    service = BookingService(session)
    booking = await service.get_booking(booking_id)

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    if booking.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    if photo_type not in ["toilet_front", "toilet_side", "valve", "additional"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid photo type",
        )

    storage = StorageService()
    upload_url, photo_url = await storage.generate_presigned_upload_url(
        f"bookings/{booking_id}/{photo_type}.jpg"
    )

    return PhotoUploadResponse(
        upload_url=upload_url,
        photo_url=photo_url,
    )


@router.post("/{booking_id}/submit", response_model=BookingResponse)
async def submit_booking(
    booking_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Submit booking for plumber matching."""
    service = BookingService(session)
    booking = await service.get_booking(booking_id)

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    if booking.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    result = await service.submit_booking(booking_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot submit booking. Ensure photos are uploaded.",
        )

    return result
