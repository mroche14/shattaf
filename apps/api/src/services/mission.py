"""Mission service."""

import base64
from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from ..models import Mission, MissionStatus, MissionPhoto, Order
from ..utils.db import uuid_column_eq


class MissionService:
    """Field mission management service."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_mission(self, mission_id: UUID) -> Optional[Mission]:
        """Get mission by ID."""
        result = await self.session.execute(
            select(Mission).where(uuid_column_eq(Mission.id, mission_id))
        )
        return result.scalar_one_or_none()

    async def get_mission_by_order(self, order_id: UUID) -> Optional[Mission]:
        """Get mission for an order."""
        result = await self.session.execute(
            select(Mission).where(uuid_column_eq(Mission.order_id, order_id))
        )
        return result.scalar_one_or_none()

    async def get_plumber_missions(
        self,
        plumber_id: UUID,
        status: Optional[MissionStatus] = None,
    ) -> list[Mission]:
        """Get missions for a plumber."""
        query = select(Mission).where(uuid_column_eq(Mission.plumber_id, plumber_id))

        if status:
            query = query.where(Mission.status == status)

        query = query.order_by(Mission.created_at.desc())
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def checkin(
        self,
        mission_id: UUID,
        lat: float,
        lng: float,
    ) -> Optional[Mission]:
        """Plumber checks in at mission location."""
        mission = await self.get_mission(mission_id)
        if not mission or mission.status != MissionStatus.SCHEDULED:
            return None

        # Get order to calculate distance from mission location
        result = await self.session.execute(
            select(Order).where(uuid_column_eq(Order.id, mission.order_id))
        )
        order = result.scalar_one_or_none()

        mission.status = MissionStatus.CHECKED_IN
        mission.checkin_time = datetime.utcnow()
        mission.checkin_lat = lat
        mission.checkin_lng = lng

        # Calculate distance if we have booking coordinates
        # (simplified - would use haversine in production)
        mission.checkin_distance_meters = 0  # Placeholder

        await self.session.commit()
        await self.session.refresh(mission)
        return mission

    async def start_work(self, mission_id: UUID) -> Optional[Mission]:
        """Start work on a mission."""
        mission = await self.get_mission(mission_id)
        if not mission or mission.status != MissionStatus.CHECKED_IN:
            return None

        mission.status = MissionStatus.IN_PROGRESS
        mission.work_started_at = datetime.utcnow()

        await self.session.commit()
        await self.session.refresh(mission)
        return mission

    async def add_photo(
        self,
        mission_id: UUID,
        photo_url: str,
        photo_type: str,
        caption: Optional[str] = None,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
    ) -> MissionPhoto:
        """Add a photo to a mission."""
        photo = MissionPhoto(
            mission_id=mission_id,
            photo_url=photo_url,
            photo_type=photo_type,
            caption=caption,
            lat=lat,
            lng=lng,
        )
        self.session.add(photo)
        await self.session.commit()
        await self.session.refresh(photo)
        return photo

    async def get_mission_photos(self, mission_id: UUID) -> list[MissionPhoto]:
        """Get all photos for a mission."""
        result = await self.session.execute(
            select(MissionPhoto)
            .where(uuid_column_eq(MissionPhoto.mission_id, mission_id))
            .order_by(MissionPhoto.taken_at.asc())
        )
        return list(result.scalars().all())

    async def add_signature(
        self,
        mission_id: UUID,
        signature_image_base64: str,
        signature_name: str,
    ) -> Optional[Mission]:
        """Add customer signature to mission."""
        mission = await self.get_mission(mission_id)
        if not mission or mission.status != MissionStatus.IN_PROGRESS:
            return None

        # In production, upload to S3 and store URL
        # For now, store base64 (would be replaced with S3 URL)
        mission.signature_image_url = f"data:image/png;base64,{signature_image_base64[:100]}..."
        mission.signature_name = signature_name
        mission.signature_timestamp = datetime.utcnow()
        mission.status = MissionStatus.PENDING_SIGNATURE
        mission.work_completed_at = datetime.utcnow()

        await self.session.commit()
        await self.session.refresh(mission)
        return mission

    async def complete_mission(
        self,
        mission_id: UUID,
        plumber_notes: Optional[str] = None,
        issues_reported: Optional[str] = None,
        require_verification: bool = False,
    ) -> Optional[Mission]:
        """Complete a mission."""
        mission = await self.get_mission(mission_id)
        if not mission or mission.status != MissionStatus.PENDING_SIGNATURE:
            return None

        if require_verification:
            mission.status = MissionStatus.PENDING_VERIFICATION
        else:
            mission.status = MissionStatus.COMPLETED
            mission.completed_at = datetime.utcnow()

        mission.plumber_notes = plumber_notes
        mission.issues_reported = issues_reported

        await self.session.commit()
        await self.session.refresh(mission)
        return mission

    async def get_today_missions(self, plumber_id: UUID) -> list[Mission]:
        """Get today's missions for a plumber."""
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start.replace(hour=23, minute=59, second=59)

        result = await self.session.execute(
            select(Mission)
            .join(Order)
            .where(uuid_column_eq(Mission.plumber_id, plumber_id))
            .where(Order.scheduled_date >= today_start)
            .where(Order.scheduled_date <= today_end)
            .order_by(Order.scheduled_date.asc())
        )
        return list(result.scalars().all())
