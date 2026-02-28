"""Job (mission) service."""

import base64
from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from ..models import Job, JobStatus, JobPhoto, Order
from ..utils.db import uuid_column_eq


class JobService:
    """Field job management service."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_job(self, job_id: UUID) -> Optional[Job]:
        """Get job by ID."""
        result = await self.session.execute(
            select(Job).where(uuid_column_eq(Job.id, job_id))
        )
        return result.scalar_one_or_none()

    async def get_job_by_order(self, order_id: UUID) -> Optional[Job]:
        """Get job for an order."""
        result = await self.session.execute(
            select(Job).where(uuid_column_eq(Job.order_id, order_id))
        )
        return result.scalar_one_or_none()

    async def get_plumber_jobs(
        self,
        plumber_id: UUID,
        status: Optional[JobStatus] = None,
    ) -> list[Job]:
        """Get jobs for a plumber."""
        query = select(Job).where(uuid_column_eq(Job.plumber_id, plumber_id))

        if status:
            query = query.where(Job.status == status)

        query = query.order_by(Job.created_at.desc())
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def checkin(
        self,
        job_id: UUID,
        lat: float,
        lng: float,
    ) -> Optional[Job]:
        """Plumber checks in at job location."""
        job = await self.get_job(job_id)
        if not job or job.status != JobStatus.SCHEDULED:
            return None

        # Get order to calculate distance from job location
        result = await self.session.execute(
            select(Order).where(uuid_column_eq(Order.id, job.order_id))
        )
        order = result.scalar_one_or_none()

        job.status = JobStatus.CHECKED_IN
        job.checkin_time = datetime.utcnow()
        job.checkin_lat = lat
        job.checkin_lng = lng

        # Calculate distance if we have booking coordinates
        # (simplified - would use haversine in production)
        job.checkin_distance_meters = 0  # Placeholder

        await self.session.commit()
        await self.session.refresh(job)
        return job

    async def start_work(self, job_id: UUID) -> Optional[Job]:
        """Start work on a job."""
        job = await self.get_job(job_id)
        if not job or job.status != JobStatus.CHECKED_IN:
            return None

        job.status = JobStatus.IN_PROGRESS
        job.work_started_at = datetime.utcnow()

        await self.session.commit()
        await self.session.refresh(job)
        return job

    async def add_photo(
        self,
        job_id: UUID,
        photo_url: str,
        photo_type: str,
        caption: Optional[str] = None,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
    ) -> JobPhoto:
        """Add a photo to a job."""
        photo = JobPhoto(
            job_id=job_id,
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

    async def get_job_photos(self, job_id: UUID) -> list[JobPhoto]:
        """Get all photos for a job."""
        result = await self.session.execute(
            select(JobPhoto)
            .where(uuid_column_eq(JobPhoto.job_id, job_id))
            .order_by(JobPhoto.taken_at.asc())
        )
        return list(result.scalars().all())

    async def add_signature(
        self,
        job_id: UUID,
        signature_image_base64: str,
        signature_name: str,
    ) -> Optional[Job]:
        """Add customer signature to job."""
        job = await self.get_job(job_id)
        if not job or job.status != JobStatus.IN_PROGRESS:
            return None

        # In production, upload to S3 and store URL
        # For now, store base64 (would be replaced with S3 URL)
        job.signature_image_url = f"data:image/png;base64,{signature_image_base64[:100]}..."
        job.signature_name = signature_name
        job.signature_timestamp = datetime.utcnow()
        job.status = JobStatus.PENDING_SIGNATURE
        job.work_completed_at = datetime.utcnow()

        await self.session.commit()
        await self.session.refresh(job)
        return job

    async def complete_job(
        self,
        job_id: UUID,
        plumber_notes: Optional[str] = None,
        issues_reported: Optional[str] = None,
    ) -> Optional[Job]:
        """Complete a job."""
        job = await self.get_job(job_id)
        if not job or job.status != JobStatus.PENDING_SIGNATURE:
            return None

        job.status = JobStatus.COMPLETED
        job.completed_at = datetime.utcnow()
        job.plumber_notes = plumber_notes
        job.issues_reported = issues_reported

        await self.session.commit()
        await self.session.refresh(job)
        return job

    async def get_today_jobs(self, plumber_id: UUID) -> list[Job]:
        """Get today's jobs for a plumber."""
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start.replace(hour=23, minute=59, second=59)

        result = await self.session.execute(
            select(Job)
            .join(Order)
            .where(uuid_column_eq(Job.plumber_id, plumber_id))
            .where(Order.scheduled_date >= today_start)
            .where(Order.scheduled_date <= today_end)
            .order_by(Order.scheduled_date.asc())
        )
        return list(result.scalars().all())
