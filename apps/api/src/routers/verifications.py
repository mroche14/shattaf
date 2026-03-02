"""Verifications router."""

from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..models import User, UserRole
from ..models.verification import VerificationStatus
from ..schemas.verification import (
    VerificationCreate,
    VerificationAccept,
    VerificationComplete,
    VerificationResponse,
)
from ..services.verification import VerificationService
from ..utils.deps import get_current_active_user

router = APIRouter(prefix="/verifications", tags=["Verifications"])


@router.post("", response_model=VerificationResponse, status_code=status.HTTP_201_CREATED)
async def create_verification(
    data: VerificationCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Create a verification request for a mission (admin or system)."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create verification requests",
        )

    service = VerificationService(session)
    verification = await service.create_verification(data.mission_id)

    if not verification:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create verification — mission not in pending_verification status or already has verification",
        )

    return verification


@router.get("/pending", response_model=list[VerificationResponse])
async def list_pending_verifications(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """List available verification assignments (plumber only)."""
    if current_user.role != UserRole.PLUMBER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only plumbers can view available verifications",
        )

    service = VerificationService(session)
    return await service.list_pending()


@router.get("/plumber", response_model=list[VerificationResponse])
async def list_my_verifications(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    status_filter: Optional[VerificationStatus] = None,
):
    """List verifications assigned to current plumber."""
    if current_user.role != UserRole.PLUMBER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only plumbers can view their verifications",
        )

    service = VerificationService(session)
    return await service.list_by_verifier(current_user.id, status_filter)


@router.get("/mission/{mission_id}", response_model=VerificationResponse)
async def get_verification_by_mission(
    mission_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Get verification for a specific mission."""
    service = VerificationService(session)
    verification = await service.get_by_mission(mission_id)

    if not verification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verification not found for this mission",
        )

    return verification


@router.get("/{verification_id}", response_model=VerificationResponse)
async def get_verification(
    verification_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Get a verification by ID."""
    service = VerificationService(session)
    verification = await service.get_verification(verification_id)

    if not verification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verification not found",
        )

    return verification


@router.post("/{verification_id}/accept", response_model=VerificationResponse)
async def accept_verification(
    verification_id: UUID,
    data: VerificationAccept,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Accept a verification assignment (plumber only)."""
    if current_user.role != UserRole.PLUMBER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only plumbers can accept verifications",
        )

    service = VerificationService(session)
    verification = await service.accept_verification(
        verification_id,
        current_user.id,
        data.scheduled_date,
    )

    if not verification:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot accept — not pending, already assigned, or cannot verify own work",
        )

    return verification


@router.post("/{verification_id}/start", response_model=VerificationResponse)
async def start_verification(
    verification_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Start on-site verification (assigned plumber only)."""
    if current_user.role != UserRole.PLUMBER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only plumbers can start verifications",
        )

    service = VerificationService(session)
    verification = await service.start_verification(verification_id, current_user.id)

    if not verification:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot start — not accepted or not assigned to you",
        )

    return verification


@router.post("/{verification_id}/complete", response_model=VerificationResponse)
async def complete_verification(
    verification_id: UUID,
    data: VerificationComplete,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Complete a verification with result (assigned plumber only)."""
    if current_user.role != UserRole.PLUMBER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only plumbers can complete verifications",
        )

    service = VerificationService(session)
    verification = await service.complete_verification(
        verification_id=verification_id,
        plumber_id=current_user.id,
        approved=data.approved,
        checklist=[item.model_dump() for item in data.checklist],
        issues=data.issues,
        verifier_notes=data.verifier_notes,
        photo_urls=data.photo_urls,
    )

    if not verification:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot complete — not in progress or not assigned to you",
        )

    return verification
