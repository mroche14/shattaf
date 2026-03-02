"""Authentication schemas."""

from pydantic import BaseModel, ConfigDict, EmailStr, Field


def to_camel(string: str) -> str:
    """Convert snake_case to camelCase."""
    components = string.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])


class CamelModel(BaseModel):
    """Base model with camelCase serialization."""
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )


class LoginRequest(BaseModel):
    """Login request."""

    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    """Registration request."""

    email: EmailStr
    phone: str
    password: str
    first_name: str
    last_name: str
    is_plumber: bool = False

    # Optional plumber fields (used when is_plumber=True)
    company_name: str | None = None
    siren: str | None = None
    siret: str | None = None
    department: str | None = None
    service_area_lat: float | None = None
    service_area_lng: float | None = None


class UserInToken(CamelModel):
    """User info included in token response."""

    id: str
    email: str
    first_name: str
    last_name: str
    role: str


class TokenResponse(CamelModel):
    """JWT token response."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserInToken


class RefreshTokenRequest(BaseModel):
    """Refresh token request."""

    refresh_token: str
