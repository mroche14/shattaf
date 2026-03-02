"""Project service."""

from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func
from sqlmodel import select

from ..models import Project, ProjectStatus, Product, Booking, Order, OrderStatus
from ..utils.db import uuid_column_eq


class ProjectService:
    """Project management service."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, **kwargs) -> Project:
        """Create a new project."""
        project = Project(**kwargs)
        self.session.add(project)
        await self.session.commit()
        await self.session.refresh(project)
        return project

    async def get(self, project_id: UUID) -> Optional[Project]:
        """Get project by ID."""
        result = await self.session.execute(
            select(Project).where(uuid_column_eq(Project.id, project_id))
        )
        return result.scalar_one_or_none()

    async def get_by_slug(self, slug: str) -> Optional[Project]:
        """Get project by slug."""
        result = await self.session.execute(
            select(Project).where(Project.slug == slug)
        )
        return result.scalar_one_or_none()

    async def list(self, status: Optional[ProjectStatus] = None) -> list[Project]:
        """List all projects, optionally filtered by status."""
        query = select(Project)
        if status:
            query = query.where(Project.status == status)
        query = query.order_by(Project.created_at.desc())
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def update(self, project_id: UUID, **kwargs) -> Optional[Project]:
        """Update a project."""
        project = await self.get(project_id)
        if not project:
            return None

        for key, value in kwargs.items():
            if value is not None:
                setattr(project, key, value)

        await self.session.commit()
        await self.session.refresh(project)
        return project

    async def get_stats(self, project_id: UUID) -> dict:
        """Get project statistics."""
        project = await self.get(project_id)
        if not project:
            return {}

        product_count = (await self.session.execute(
            select(func.count(Product.id)).where(
                uuid_column_eq(Product.project_id, project_id)
            )
        )).scalar_one()

        booking_count = (await self.session.execute(
            select(func.count(Booking.id)).where(
                uuid_column_eq(Booking.project_id, project_id)
            )
        )).scalar_one()

        order_count = (await self.session.execute(
            select(func.count(Order.id))
            .join(Booking, Order.booking_id == Booking.id)
            .where(uuid_column_eq(Booking.project_id, project_id))
        )).scalar_one()

        revenue = (await self.session.execute(
            select(func.sum(Order.total_amount))
            .join(Booking, Order.booking_id == Booking.id)
            .where(
                uuid_column_eq(Booking.project_id, project_id),
                Order.status == OrderStatus.COMPLETED,
            )
        )).scalar_one() or 0

        return {
            "id": str(project.id),
            "name": project.name,
            "slug": project.slug,
            "product_count": product_count,
            "booking_count": booking_count,
            "order_count": order_count,
            "revenue": int(revenue),
        }
