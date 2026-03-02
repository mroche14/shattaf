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
from .mission import (
    MissionResponse,
    MissionCheckin,
    MissionPhotoUpload,
    MissionSignature,
    MissionComplete,
)
from .invoice import (
    InvoiceResponse,
    InvoiceItemResponse,
)
from .ai_devis import (
    AiDevisRequest,
    AiDevisResponse,
    AiDevisLineItem,
)
from .verification import (
    VerificationCreate,
    VerificationAccept,
    VerificationComplete,
    VerificationResponse,
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
    # Mission
    "MissionResponse",
    "MissionCheckin",
    "MissionPhotoUpload",
    "MissionSignature",
    "MissionComplete",
    # Invoice
    "InvoiceResponse",
    "InvoiceItemResponse",
    # AI Devis
    "AiDevisRequest",
    "AiDevisResponse",
    "AiDevisLineItem",
    # Verification
    "VerificationCreate",
    "VerificationAccept",
    "VerificationComplete",
    "VerificationResponse",
]
