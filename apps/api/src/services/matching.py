"""Plumber matching service."""

import math
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from ..models import Booking, PlumberProfile, PlumberStatus, User, UserRole
from ..utils.db import uuid_column_eq


def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two points in km using Haversine formula."""
    R = 6371  # Earth's radius in km

    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)

    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


class MatchingService:
    """Plumber matching service based on distance and availability."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def find_available_plumbers(
        self,
        booking: Booking,
        max_distance_km: float = 30.0,
    ) -> list[tuple[PlumberProfile, float]]:
        """
        Find available plumbers for a booking.
        Returns list of (profile, distance_km) tuples sorted by distance.
        """
        if not booking.address_lat or not booking.address_lng:
            return []

        # Get all active plumbers with Stripe enabled
        result = await self.session.execute(
            select(PlumberProfile)
            .join(User)
            .where(PlumberProfile.status == PlumberStatus.ACTIVE)
            .where(PlumberProfile.stripe_charges_enabled == True)
            .where(PlumberProfile.mandate_signed == True)
            .where(User.is_active == True)
        )
        plumbers = result.scalars().all()

        # Calculate distances and filter
        candidates: list[tuple[PlumberProfile, float]] = []
        for plumber in plumbers:
            if not plumber.service_area_lat or not plumber.service_area_lng:
                continue

            distance = haversine_distance(
                booking.address_lat,
                booking.address_lng,
                plumber.service_area_lat,
                plumber.service_area_lng,
            )

            # Check if within plumber's service radius and max distance
            if distance <= plumber.service_area_radius_km and distance <= max_distance_km:
                candidates.append((plumber, distance))

        # Sort by distance (closest first)
        candidates.sort(key=lambda x: x[1])

        return candidates

    async def auto_match_booking(
        self,
        booking_id: UUID,
    ) -> Optional[PlumberProfile]:
        """
        Automatically match a booking to the nearest available plumber.
        Returns the matched plumber or None.
        """
        result = await self.session.execute(
            select(Booking).where(uuid_column_eq(Booking.id, booking_id))
        )
        booking = result.scalar_one_or_none()

        if not booking:
            return None

        candidates = await self.find_available_plumbers(booking)

        if not candidates:
            return None

        # Select the closest plumber
        best_plumber, _ = candidates[0]
        return best_plumber
