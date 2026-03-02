"""Missions router."""

from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..models import User, UserRole, MissionStatus
from ..schemas import MissionResponse, MissionCheckin, MissionPhotoUpload, MissionSignature, MissionComplete
from ..schemas.mission import MissionPhotoResponse
from ..services.mission import MissionService
from ..utils.deps import get_current_active_user

router = APIRouter(prefix="/missions", tags=["Missions"])


@router.get("", response_model=list[MissionResponse])
async def list_missions(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    status_filter: Optional[MissionStatus] = None,
) -> list:
    """List missions for current plumber."""
    if current_user.role != UserRole.PLUMBER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only plumbers can view missions",
        )

    service = MissionService(session)
    return await service.get_plumber_missions(
        plumber_id=current_user.id,
        status=status_filter,
    )


@router.get("/today", response_model=list[MissionResponse])
async def list_today_missions(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list:
    """List today's missions for current plumber."""
    if current_user.role != UserRole.PLUMBER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only plumbers can view missions",
        )

    service = MissionService(session)
    return await service.get_today_missions(current_user.id)


@router.get("/{mission_id}", response_model=MissionResponse)
async def get_mission(
    mission_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Get a mission."""
    service = MissionService(session)
    mission = await service.get_mission(mission_id)

    if not mission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mission not found",
        )

    if mission.plumber_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    return mission


@router.post("/{mission_id}/checkin", response_model=MissionResponse)
async def checkin_mission(
    mission_id: UUID,
    data: MissionCheckin,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Check in at mission location."""
    if current_user.role != UserRole.PLUMBER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only plumbers can check in",
        )

    service = MissionService(session)
    mission = await service.get_mission(mission_id)

    if not mission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mission not found",
        )

    if mission.plumber_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Mission not assigned to you",
        )

    result = await service.checkin(mission_id, data.lat, data.lng)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot check in. Mission may already be started.",
        )

    return result


@router.post("/{mission_id}/start", response_model=MissionResponse)
async def start_mission(
    mission_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Start work on a mission."""
    if current_user.role != UserRole.PLUMBER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only plumbers can start missions",
        )

    service = MissionService(session)
    mission = await service.get_mission(mission_id)

    if not mission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mission not found",
        )

    if mission.plumber_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Mission not assigned to you",
        )

    result = await service.start_work(mission_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot start mission. Must check in first.",
        )

    return result


@router.post("/{mission_id}/photos", response_model=MissionPhotoResponse)
async def add_mission_photo(
    mission_id: UUID,
    photo_url: str,
    data: MissionPhotoUpload,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Add a photo to a mission."""
    if current_user.role != UserRole.PLUMBER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only plumbers can add photos",
        )

    service = MissionService(session)
    mission = await service.get_mission(mission_id)

    if not mission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mission not found",
        )

    if mission.plumber_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Mission not assigned to you",
        )

    return await service.add_photo(
        mission_id=mission_id,
        photo_url=photo_url,
        photo_type=data.photo_type,
        caption=data.caption,
        lat=data.lat,
        lng=data.lng,
    )


@router.get("/{mission_id}/photos", response_model=list[MissionPhotoResponse])
async def get_mission_photos(
    mission_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list:
    """Get photos for a mission."""
    service = MissionService(session)
    mission = await service.get_mission(mission_id)

    if not mission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mission not found",
        )

    if mission.plumber_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    return await service.get_mission_photos(mission_id)


@router.post("/{mission_id}/signature", response_model=MissionResponse)
async def add_signature(
    mission_id: UUID,
    data: MissionSignature,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Add customer signature to mission."""
    if current_user.role != UserRole.PLUMBER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only plumbers can collect signatures",
        )

    service = MissionService(session)
    mission = await service.get_mission(mission_id)

    if not mission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mission not found",
        )

    if mission.plumber_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Mission not assigned to you",
        )

    result = await service.add_signature(
        mission_id,
        data.signature_image_base64,
        data.signature_name,
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot add signature. Mission must be in progress.",
        )

    return result


@router.post("/{mission_id}/complete", response_model=MissionResponse)
async def complete_mission(
    mission_id: UUID,
    data: MissionComplete,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Complete a mission."""
    if current_user.role != UserRole.PLUMBER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only plumbers can complete missions",
        )

    service = MissionService(session)
    mission = await service.get_mission(mission_id)

    if not mission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mission not found",
        )

    if mission.plumber_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Mission not assigned to you",
        )

    result = await service.complete_mission(
        mission_id,
        plumber_notes=data.plumber_notes,
        issues_reported=data.issues_reported,
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot complete mission. Signature required first.",
        )

    return result
