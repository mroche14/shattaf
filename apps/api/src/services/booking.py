"""Booking service."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from ..models import Booking, BookingStatus
from ..utils.db import uuid_column_eq


class BookingService:
    """Booking management service."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_booking(
        self,
        customer_id: UUID,
        **kwargs,
    ) -> Booking:
        """Create a new booking."""
        booking = Booking(
            customer_id=customer_id,
            status=BookingStatus.DRAFT,
            **kwargs,
        )
        self.session.add(booking)
        await self.session.commit()
        await self.session.refresh(booking)
        return booking

    async def get_booking(self, booking_id: UUID) -> Optional[Booking]:
        """Get booking by ID."""
        result = await self.session.execute(
            select(Booking).where(uuid_column_eq(Booking.id, booking_id))
        )
        return result.scalar_one_or_none()

    async def get_customer_bookings(
        self,
        customer_id: UUID,
        status: Optional[BookingStatus] = None,
    ) -> list[Booking]:
        """Get bookings for a customer."""
        query = select(Booking).where(uuid_column_eq(Booking.customer_id, customer_id))

        if status:
            query = query.where(Booking.status == status)

        query = query.order_by(Booking.created_at.desc())
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def update_booking(
        self,
        booking_id: UUID,
        **kwargs,
    ) -> Optional[Booking]:
        """Update a booking."""
        booking = await self.get_booking(booking_id)
        if not booking:
            return None

        for key, value in kwargs.items():
            if value is not None and hasattr(booking, key):
                setattr(booking, key, value)

        await self.session.commit()
        await self.session.refresh(booking)
        return booking

    async def submit_booking(self, booking_id: UUID) -> Optional[Booking]:
        """Submit booking for plumber matching."""
        booking = await self.get_booking(booking_id)
        if not booking:
            return None

        if booking.status != BookingStatus.DRAFT:
            return None

        # Validate required photos
        if not booking.photo_toilet_front_url or not booking.photo_toilet_side_url:
            return None

        booking.status = BookingStatus.SUBMITTED
        await self.session.commit()
        await self.session.refresh(booking)
        return booking

    async def get_pending_bookings(self) -> list[Booking]:
        """Get bookings waiting for matching."""
        result = await self.session.execute(
            select(Booking)
            .where(Booking.status == BookingStatus.SUBMITTED)
            .where(Booking.assigned_plumber_id.is_(None))
            .order_by(Booking.created_at.asc())
        )
        return list(result.scalars().all())

    async def assign_plumber(
        self,
        booking_id: UUID,
        plumber_id: UUID,
    ) -> Optional[Booking]:
        """Assign a plumber to a booking."""
        booking = await self.get_booking(booking_id)
        if not booking:
            return None

        booking.assigned_plumber_id = plumber_id
        booking.matched_at = datetime.utcnow()
        await self.session.commit()
        await self.session.refresh(booking)
        return booking
