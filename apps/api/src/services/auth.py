"""Authentication service."""

from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from ..config import get_settings
from ..models import User, UserRole, CustomerProfile, PlumberProfile

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Authentication and authorization service."""

    def __init__(self, session: AsyncSession):
        self.session = session

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password."""
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against hash."""
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def create_access_token(user_id: UUID, role: UserRole) -> str:
        """Create JWT access token."""
        expire = datetime.utcnow() + timedelta(
            minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
        )
        payload = {
            "sub": str(user_id),
            "role": role.value,
            "exp": expire,
            "type": "access",
        }
        return jwt.encode(
            payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
        )

    @staticmethod
    def create_refresh_token(user_id: UUID) -> str:
        """Create JWT refresh token."""
        expire = datetime.utcnow() + timedelta(
            days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS
        )
        payload = {
            "sub": str(user_id),
            "exp": expire,
            "type": "refresh",
        }
        return jwt.encode(
            payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
        )

    @staticmethod
    def decode_token(token: str) -> Optional[dict]:
        """Decode and validate JWT token."""
        try:
            payload = jwt.decode(
                token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
            )
            return payload
        except JWTError:
            return None

    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        result = await self.session.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def get_user_by_id(self, user_id: UUID) -> Optional[User]:
        """Get user by ID."""
        result = await self.session.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def register(
        self,
        email: str,
        phone: str,
        password: str,
        first_name: str,
        last_name: str,
        is_plumber: bool = False,
    ) -> User:
        """Register a new user."""
        hashed_password = self.hash_password(password)

        user = User(
            email=email,
            phone=phone,
            hashed_password=hashed_password,
            first_name=first_name,
            last_name=last_name,
            role=UserRole.PLUMBER if is_plumber else UserRole.CUSTOMER,
        )

        self.session.add(user)
        await self.session.flush()

        # Create profile based on role
        if is_plumber:
            profile = PlumberProfile(user_id=user.id)
            self.session.add(profile)
            await self.session.flush()

            # Try to auto-link to existing prospect (lazy import to avoid circular dependency)
            from .prospect import ProspectService
            prospect_service = ProspectService(self.session)
            await prospect_service.link_plumber_to_prospect(
                plumber=profile,
                phone=phone,
            )
        else:
            profile = CustomerProfile(user_id=user.id)
            self.session.add(profile)

        await self.session.commit()
        await self.session.refresh(user)

        return user

    async def authenticate(self, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password."""
        user = await self.get_user_by_email(email)
        if not user:
            return None
        if not self.verify_password(password, user.hashed_password):
            return None
        if not user.is_active:
            return None
        return user
