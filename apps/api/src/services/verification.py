"""Verification service — peer quality check workflow."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.verification import Verification, VerificationStatus
from ..models.mission import Mission, MissionStatus
from ..utils.db import uuid_column_eq


class VerificationService:
    """Service for managing verifications."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_verification(
        self,
        mission_id: UUID,
    ) -> Optional[Verification]:
        """Create a verification request for a completed mission."""
        # Fetch mission
        result = await self.session.execute(
            select(Mission).where(uuid_column_eq(Mission.id, mission_id))
        )
        mission = result.scalar_one_or_none()

        if not mission:
            return None

        if mission.status != MissionStatus.PENDING_VERIFICATION:
            return None

        # Check no existing verification
        existing = await self.session.execute(
            select(Verification).where(uuid_column_eq(Verification.mission_id, mission_id))
        )
        if existing.scalar_one_or_none():
            return None

        verification = Verification(
            mission_id=mission_id,
            status=VerificationStatus.PENDING,
        )

        self.session.add(verification)
        await self.session.commit()
        await self.session.refresh(verification)
        return verification

    async def get_verification(self, verification_id: UUID) -> Optional[Verification]:
        """Get a verification by ID."""
        result = await self.session.execute(
            select(Verification).where(uuid_column_eq(Verification.id, verification_id))
        )
        return result.scalar_one_or_none()

    async def get_by_mission(self, mission_id: UUID) -> Optional[Verification]:
        """Get verification for a mission."""
        result = await self.session.execute(
            select(Verification).where(uuid_column_eq(Verification.mission_id, mission_id))
        )
        return result.scalar_one_or_none()

    async def list_pending(self) -> list[Verification]:
        """List pending verifications available for assignment."""
        result = await self.session.execute(
            select(Verification).where(
                Verification.status == VerificationStatus.PENDING
            )
        )
        return list(result.scalars().all())

    async def list_by_verifier(
        self,
        plumber_id: UUID,
        status: Optional[VerificationStatus] = None,
    ) -> list[Verification]:
        """List verifications assigned to a plumber."""
        query = select(Verification).where(
            Verification.verifier_plumber_id == plumber_id
        )
        if status:
            query = query.where(Verification.status == status)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def accept_verification(
        self,
        verification_id: UUID,
        plumber_id: UUID,
        scheduled_date: Optional[datetime] = None,
    ) -> Optional[Verification]:
        """Verifier accepts a verification assignment."""
        verification = await self.get_verification(verification_id)
        if not verification or verification.status != VerificationStatus.PENDING:
            return None

        # Ensure the verifier is not the original plumber
        result = await self.session.execute(
            select(Mission).where(uuid_column_eq(Mission.id, verification.mission_id))
        )
        mission = result.scalar_one_or_none()
        if mission and mission.plumber_id == plumber_id:
            return None  # Cannot verify your own work

        verification.verifier_plumber_id = plumber_id
        verification.status = VerificationStatus.ACCEPTED
        verification.accepted_at = datetime.utcnow()
        verification.scheduled_date = scheduled_date

        self.session.add(verification)
        await self.session.commit()
        await self.session.refresh(verification)
        return verification

    async def start_verification(
        self,
        verification_id: UUID,
        plumber_id: UUID,
    ) -> Optional[Verification]:
        """Verifier starts the on-site check."""
        verification = await self.get_verification(verification_id)
        if not verification or verification.status != VerificationStatus.ACCEPTED:
            return None
        if verification.verifier_plumber_id != plumber_id:
            return None

        verification.status = VerificationStatus.IN_PROGRESS
        verification.started_at = datetime.utcnow()

        self.session.add(verification)
        await self.session.commit()
        await self.session.refresh(verification)
        return verification

    async def complete_verification(
        self,
        verification_id: UUID,
        plumber_id: UUID,
        approved: bool,
        checklist: list[dict],
        issues: Optional[str] = None,
        verifier_notes: Optional[str] = None,
        photo_urls: Optional[list[str]] = None,
    ) -> Optional[Verification]:
        """Complete the verification with a result."""
        verification = await self.get_verification(verification_id)
        if not verification or verification.status != VerificationStatus.IN_PROGRESS:
            return None
        if verification.verifier_plumber_id != plumber_id:
            return None

        verification.status = (
            VerificationStatus.APPROVED if approved else VerificationStatus.REJECTED
        )
        verification.approved = approved
        verification.checklist = checklist
        verification.issues = issues
        verification.verifier_notes = verifier_notes
        verification.photo_urls = photo_urls or []
        verification.completed_at = datetime.utcnow()

        self.session.add(verification)

        # If approved, update mission status to COMPLETED
        if approved:
            result = await self.session.execute(
                select(Mission).where(uuid_column_eq(Mission.id, verification.mission_id))
            )
            mission = result.scalar_one_or_none()
            if mission:
                mission.status = MissionStatus.COMPLETED
                mission.completed_at = datetime.utcnow()
                self.session.add(mission)

        await self.session.commit()
        await self.session.refresh(verification)
        return verification
