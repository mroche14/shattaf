"""Project schemas."""

from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel

from ..models.project import ProjectType, ProjectStatus


class ProjectCreate(BaseModel):
    """Create a project."""

    name: str
    slug: str
    type: ProjectType = ProjectType.INTERNAL
    status: ProjectStatus = ProjectStatus.DRAFT
    description: Optional[str] = None
    department: Optional[str] = None
    landing_page_url: Optional[str] = None
    marketing_config: Optional[dict] = None


class ProjectUpdate(BaseModel):
    """Update a project."""

    name: Optional[str] = None
    status: Optional[ProjectStatus] = None
    description: Optional[str] = None
    department: Optional[str] = None
    landing_page_url: Optional[str] = None
    marketing_config: Optional[dict] = None


class ProjectResponse(BaseModel):
    """Project response."""

    id: UUID
    name: str
    slug: str
    type: ProjectType
    status: ProjectStatus
    description: Optional[str] = None
    department: Optional[str] = None
    landing_page_url: Optional[str] = None
    marketing_config: Optional[dict] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProjectStats(BaseModel):
    """Project statistics."""

    id: UUID
    name: str
    slug: str
    product_count: int = 0
    booking_count: int = 0
    order_count: int = 0
    revenue: int = 0
