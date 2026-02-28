"""Pydantic schemas for request/response validation."""

from .auth import (
    TokenResponse,
    LoginRequest,
    RegisterRequest,
    RefreshTokenRequest,
    UserInToken,
)
from .user import (
    UserResponse,
    UserUpdate,
    CustomerProfileCreate,
    CustomerProfileResponse,
    PlumberProfileCreate,
    PlumberProfileResponse,
    InterventionLocation,
    AddInterventionLocationRequest,
)
from .product import (
    ProductResponse,
    ProductCreate,
    ProductUpdate,
)
from .booking import (
    BookingCreate,
    BookingUpdate,
    BookingResponse,
    PhotoUploadResponse,
)
from .quote import (
    QuoteCreate,
    QuoteResponse,
    QuoteAccept,
)
from .order import (
    OrderResponse,
    OrderItemResponse,
)
from .job import (
    JobResponse,
    JobCheckin,
    JobPhotoUpload,
    JobSignature,
    JobComplete,
)
from .invoice import (
    InvoiceResponse,
    InvoiceItemResponse,
)

__all__ = [
    # Auth
    "TokenResponse",
    "LoginRequest",
    "RegisterRequest",
    "RefreshTokenRequest",
    "UserInToken",
    # User
    "UserResponse",
    "UserUpdate",
    "CustomerProfileCreate",
    "CustomerProfileResponse",
    "PlumberProfileCreate",
    "PlumberProfileResponse",
    "InterventionLocation",
    "AddInterventionLocationRequest",
    # Product
    "ProductResponse",
    "ProductCreate",
    "ProductUpdate",
    # Booking
    "BookingCreate",
    "BookingUpdate",
    "BookingResponse",
    "PhotoUploadResponse",
    # Quote
    "QuoteCreate",
    "QuoteResponse",
    "QuoteAccept",
    # Order
    "OrderResponse",
    "OrderItemResponse",
    # Job
    "JobResponse",
    "JobCheckin",
    "JobPhotoUpload",
    "JobSignature",
    "JobComplete",
    # Invoice
    "InvoiceResponse",
    "InvoiceItemResponse",
]
