"""Jobs router."""

from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..models import User, UserRole, JobStatus
from ..schemas import JobResponse, JobCheckin, JobPhotoUpload, JobSignature, JobComplete
from ..schemas.job import JobPhotoResponse
from ..services.job import JobService
from ..utils.deps import get_current_active_user

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.get("", response_model=list[JobResponse])
async def list_jobs(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    status_filter: Optional[JobStatus] = None,
) -> list:
    """List jobs for current plumber."""
    if current_user.role != UserRole.PLUMBER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only plumbers can view jobs",
        )

    service = JobService(session)
    return await service.get_plumber_jobs(
        plumber_id=current_user.id,
        status=status_filter,
    )


@router.get("/today", response_model=list[JobResponse])
async def list_today_jobs(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list:
    """List today's jobs for current plumber."""
    if current_user.role != UserRole.PLUMBER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only plumbers can view jobs",
        )

    service = JobService(session)
    return await service.get_today_jobs(current_user.id)


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Get a job."""
    service = JobService(session)
    job = await service.get_job(job_id)

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    if job.plumber_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    return job


@router.post("/{job_id}/checkin", response_model=JobResponse)
async def checkin_job(
    job_id: UUID,
    data: JobCheckin,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Check in at job location."""
    if current_user.role != UserRole.PLUMBER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only plumbers can check in",
        )

    service = JobService(session)
    job = await service.get_job(job_id)

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    if job.plumber_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Job not assigned to you",
        )

    result = await service.checkin(job_id, data.lat, data.lng)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot check in. Job may already be started.",
        )

    return result


@router.post("/{job_id}/start", response_model=JobResponse)
async def start_job(
    job_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Start work on a job."""
    if current_user.role != UserRole.PLUMBER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only plumbers can start jobs",
        )

    service = JobService(session)
    job = await service.get_job(job_id)

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    if job.plumber_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Job not assigned to you",
        )

    result = await service.start_work(job_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot start job. Must check in first.",
        )

    return result


@router.post("/{job_id}/photos", response_model=JobPhotoResponse)
async def add_job_photo(
    job_id: UUID,
    photo_url: str,
    data: JobPhotoUpload,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Add a photo to a job."""
    if current_user.role != UserRole.PLUMBER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only plumbers can add photos",
        )

    service = JobService(session)
    job = await service.get_job(job_id)

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    if job.plumber_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Job not assigned to you",
        )

    return await service.add_photo(
        job_id=job_id,
        photo_url=photo_url,
        photo_type=data.photo_type,
        caption=data.caption,
        lat=data.lat,
        lng=data.lng,
    )


@router.get("/{job_id}/photos", response_model=list[JobPhotoResponse])
async def get_job_photos(
    job_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list:
    """Get photos for a job."""
    service = JobService(session)
    job = await service.get_job(job_id)

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    if job.plumber_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    return await service.get_job_photos(job_id)


@router.post("/{job_id}/signature", response_model=JobResponse)
async def add_signature(
    job_id: UUID,
    data: JobSignature,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Add customer signature to job."""
    if current_user.role != UserRole.PLUMBER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only plumbers can collect signatures",
        )

    service = JobService(session)
    job = await service.get_job(job_id)

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    if job.plumber_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Job not assigned to you",
        )

    result = await service.add_signature(
        job_id,
        data.signature_image_base64,
        data.signature_name,
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot add signature. Job must be in progress.",
        )

    return result


@router.post("/{job_id}/complete", response_model=JobResponse)
async def complete_job(
    job_id: UUID,
    data: JobComplete,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Complete a job."""
    if current_user.role != UserRole.PLUMBER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only plumbers can complete jobs",
        )

    service = JobService(session)
    job = await service.get_job(job_id)

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    if job.plumber_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Job not assigned to you",
        )

    result = await service.complete_job(
        job_id,
        plumber_notes=data.plumber_notes,
        issues_reported=data.issues_reported,
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot complete job. Signature required first.",
        )

    return result
