"""Project model."""

from enum import Enum
from typing import Optional
from sqlmodel import Field, Column, JSON

from .base import BaseModel


class ProjectType(str, Enum):
    """Project type."""

    INTERNAL = "internal"  # Platform-managed campaign (e.g. Shattaf)
    MARKETPLACE = "marketplace"  # Open marketplace category


class ProjectStatus(str, Enum):
    """Project status."""

    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    ARCHIVED = "archived"


class Project(BaseModel, table=True):
    """Business project/campaign."""

    __tablename__ = "projects"

    name: str  # "Shattaf Douchettes"
    slug: str = Field(unique=True, index=True)  # "shattaf"
    type: ProjectType = Field(default=ProjectType.INTERNAL)
    status: ProjectStatus = Field(default=ProjectStatus.DRAFT)
    description: Optional[str] = None
    department: Optional[str] = None  # null = all departments
    landing_page_url: Optional[str] = None  # Each project has its own funnel
    marketing_config: Optional[dict] = Field(default=None, sa_column=Column(JSON, nullable=True))
