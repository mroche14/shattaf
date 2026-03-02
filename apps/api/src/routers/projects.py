"""Projects router (admin-only)."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..models import User, ProjectStatus
from ..schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectStats
from ..services.project import ProjectService
from ..utils.deps import get_current_admin_user

router = APIRouter(prefix="/admin/projects", tags=["Projects"])


@router.get("", response_model=list[ProjectResponse])
async def list_projects(
    status_filter: Optional[ProjectStatus] = None,
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_admin_user),
):
    """List all projects."""
    service = ProjectService(session)
    return await service.list(status=status_filter)


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_admin_user),
):
    """Create a new project."""
    service = ProjectService(session)

    # Check slug uniqueness
    existing = await service.get_by_slug(data.slug)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Project with slug '{data.slug}' already exists",
        )

    return await service.create(**data.model_dump())


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: UUID,
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_admin_user),
):
    """Get a project by ID."""
    service = ProjectService(session)
    project = await service.get(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return project


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: UUID,
    data: ProjectUpdate,
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_admin_user),
):
    """Update a project."""
    service = ProjectService(session)
    project = await service.update(project_id, **data.model_dump(exclude_unset=True))
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return project


@router.get("/{project_id}/stats", response_model=ProjectStats)
async def get_project_stats(
    project_id: UUID,
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_admin_user),
):
    """Get project statistics."""
    service = ProjectService(session)
    stats = await service.get_stats(project_id)
    if not stats:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return stats
