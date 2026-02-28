"""User service."""

from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from ..models import User, CustomerProfile, PlumberProfile
from ..utils.db import uuid_column_eq


class UserService:
    """User management service."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_user(self, user_id: UUID) -> Optional[User]:
        """Get user by ID."""
        result = await self.session.execute(
            select(User).where(uuid_column_eq(User.id, user_id))
        )
        return result.scalar_one_or_none()

    async def update_user(
        self,
        user_id: UUID,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        phone: Optional[str] = None,
        avatar_url: Optional[str] = None,
    ) -> Optional[User]:
        """Update user profile."""
        user = await self.get_user(user_id)
        if not user:
            return None

        if first_name is not None:
            user.first_name = first_name
        if last_name is not None:
            user.last_name = last_name
        if phone is not None:
            user.phone = phone
        if avatar_url is not None:
            user.avatar_url = avatar_url

        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def get_customer_profile(self, user_id: UUID) -> Optional[CustomerProfile]:
        """Get customer profile."""
        result = await self.session.execute(
            select(CustomerProfile).where(uuid_column_eq(CustomerProfile.user_id, user_id))
        )
        return result.scalar_one_or_none()

    async def update_customer_profile(
        self,
        user_id: UUID,
        **kwargs,
    ) -> Optional[CustomerProfile]:
        """Update customer profile."""
        profile = await self.get_customer_profile(user_id)
        if not profile:
            return None

        for key, value in kwargs.items():
            if value is not None and hasattr(profile, key):
                setattr(profile, key, value)

        await self.session.commit()
        await self.session.refresh(profile)
        return profile

    async def get_plumber_profile(self, user_id: UUID) -> Optional[PlumberProfile]:
        """Get plumber profile."""
        result = await self.session.execute(
            select(PlumberProfile).where(uuid_column_eq(PlumberProfile.user_id, user_id))
        )
        return result.scalar_one_or_none()

    async def update_plumber_profile(
        self,
        user_id: UUID,
        **kwargs,
    ) -> Optional[PlumberProfile]:
        """Update plumber profile."""
        profile = await self.get_plumber_profile(user_id)
        if not profile:
            return None

        for key, value in kwargs.items():
            if value is not None and hasattr(profile, key):
                setattr(profile, key, value)

        await self.session.commit()
        await self.session.refresh(profile)
        return profile
