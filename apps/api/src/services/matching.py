"""Plumber matching service."""

import math
from typing import Any, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from ..models import Booking, PlumberProfile, PlumberStatus, User, UserRole
from ..utils.db import uuid_column_eq

DEFAULT_WEIGHTS = {"proximity": 40, "quality": 35, "load": 25}
BAYESIAN_CONFIDENCE = 10  # Number of ratings before raw average fully dominates


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


def _normalize_weights(weights: Optional[dict[str, float]]) -> dict[str, float]:
    """Normalize weights so they sum to 1. Falls back to defaults if all zero."""
    w = dict(weights) if weights else dict(DEFAULT_WEIGHTS)
    total = sum(w.values())
    if total > 0:
        return {k: v / total for k, v in w.items()}
    return {k: v / sum(DEFAULT_WEIGHTS.values()) for k, v in DEFAULT_WEIGHTS.items()}


def compute_matching_scores(
    candidates: list[tuple[PlumberProfile, float]],
    weights: Optional[dict[str, float]] = None,
) -> list[dict[str, Any]]:
    """
    Pure scoring function — no DB access.

    Each candidate is a (PlumberProfile, distance_km) tuple.
    Returns a list of score dicts sorted by total_score descending.
    """
    if not candidates:
        return []

    w = _normalize_weights(weights)

    # Pre-compute max jobs across all candidates for load balancing
    max_jobs = max(p.total_missions_completed for p, _ in candidates)

    # Use the farthest candidate as the reference distance for relative scoring
    max_distance = max(d for _, d in candidates) if candidates else 1.0

    scored: list[dict[str, Any]] = []
    for plumber, distance_km in candidates:
        # Proximity: 0-100, relative to farthest candidate
        # Closest → ~100, farthest → 0
        proximity = max(0.0, 100.0 * (1.0 - distance_km / max_distance)) if max_distance > 0 else 100.0

        # Quality: Bayesian average, 0-100
        C = BAYESIAN_CONFIDENCE
        n = min(plumber.total_ratings, C)
        raw = (plumber.average_rating / 5.0) if plumber.average_rating else 0.5
        quality = (raw * n / C + 0.5 * (C - n) / C) * 100.0

        # Load: relative to busiest candidate, 0-100
        load = 100.0 * (1.0 - plumber.total_missions_completed / (max_jobs + 1))

        total_score = (
            w.get("proximity", 0) * proximity
            + w.get("quality", 0) * quality
            + w.get("load", 0) * load
        )

        scored.append({
            "plumber": plumber,
            "distance_km": round(distance_km, 2),
            "total_score": round(total_score, 1),
            "proximity_score": round(proximity, 1),
            "quality_score": round(quality, 1),
            "load_score": round(load, 1),
        })

    scored.sort(key=lambda x: -x["total_score"])
    return scored


async def simulate_matching_at_point(
    session: AsyncSession,
    lat: float,
    lng: float,
    department: Optional[str] = None,
    weights: Optional[dict[str, float]] = None,
) -> list[dict[str, Any]]:
    """
    Query all active plumbers in a department, compute distances and score them.

    Returns all plumbers ranked by score — no distance or count limit.
    This mirrors the real matching flow: when a booking arrives, all plumbers
    are considered and then notified sequentially by rank.
    """
    query = (
        select(PlumberProfile)
        .join(User)
        .where(PlumberProfile.status == PlumberStatus.ACTIVE)
        .where(PlumberProfile.stripe_charges_enabled == True)
        .where(PlumberProfile.mandate_signed == True)
        .where(User.is_active == True)
    )

    if department:
        query = query.where(PlumberProfile.department == department)

    result = await session.execute(query)
    plumbers = result.scalars().all()

    # Compute distance for all plumbers with coordinates
    candidates: list[tuple[PlumberProfile, float]] = []
    for plumber in plumbers:
        if not plumber.service_area_lat or not plumber.service_area_lng:
            continue

        distance = haversine_distance(
            lat, lng,
            plumber.service_area_lat, plumber.service_area_lng,
        )

        candidates.append((plumber, distance))

    return compute_matching_scores(candidates, weights)


async def find_matching_plumbers(
    session: AsyncSession,
    lat: float,
    lng: float,
    max_results: int = 10,
    max_distance_km: float = 50.0,
) -> list[tuple[PlumberProfile, float]]:
    """
    Legacy-compatible function used by admin.py simulate_matching.
    Returns (PlumberProfile, distance) tuples sorted by distance.
    """
    query = (
        select(PlumberProfile)
        .join(User)
        .where(PlumberProfile.status == PlumberStatus.ACTIVE)
        .where(PlumberProfile.stripe_charges_enabled == True)
        .where(PlumberProfile.mandate_signed == True)
        .where(User.is_active == True)
    )

    result = await session.execute(query)
    plumbers = result.scalars().all()

    candidates: list[tuple[PlumberProfile, float]] = []
    for plumber in plumbers:
        if not plumber.service_area_lat or not plumber.service_area_lng:
            continue

        distance = haversine_distance(
            lat, lng,
            plumber.service_area_lat, plumber.service_area_lng,
        )

        if distance <= plumber.service_area_radius_km and distance <= max_distance_km:
            candidates.append((plumber, distance))

    candidates.sort(key=lambda x: x[1])
    return candidates[:max_results]
