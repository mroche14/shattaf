"""SQLModel database models."""

from .user import User, UserRole
from .customer import CustomerProfile
from .plumber import PlumberProfile, PlumberStatus
from .product import Product, ProductCategory
from .pricing import PricingConfig
from .project import Project, ProjectType, ProjectStatus
from .booking import Booking, BookingType, BookingStatus, ToiletType
from .quote import Quote, QuoteStatus
from .order import Order, OrderItem, OrderStatus, PaymentStatus
from .mission import Mission, MissionStatus, MissionPhoto
from .invoice import Invoice, InvoiceItem, InvoiceStatus
from .mandate import Mandate, MandateStatus
from .ticket import SupportTicket, TicketStatus, TicketCategory
from .audit import AuditLog
from .prospect import PlumberProspect, ContactStatus
from .verification import Verification, VerificationStatus
from .dead_zone_cache import DeadZoneCache

__all__ = [
    # User
    "User",
    "UserRole",
    # Customer
    "CustomerProfile",
    # Plumber
    "PlumberProfile",
    "PlumberStatus",
    # Product
    "Product",
    "ProductCategory",
    # Pricing
    "PricingConfig",
    # Project
    "Project",
    "ProjectType",
    "ProjectStatus",
    # Booking
    "Booking",
    "BookingType",
    "BookingStatus",
    "ToiletType",
    # Quote
    "Quote",
    "QuoteStatus",
    # Order
    "Order",
    "OrderItem",
    "OrderStatus",
    "PaymentStatus",
    # Mission
    "Mission",
    "MissionStatus",
    "MissionPhoto",
    # Invoice
    "Invoice",
    "InvoiceItem",
    "InvoiceStatus",
    # Mandate
    "Mandate",
    "MandateStatus",
    # Ticket
    "SupportTicket",
    "TicketStatus",
    "TicketCategory",
    # Audit
    "AuditLog",
    # Prospect
    "PlumberProspect",
    "ContactStatus",
    # Verification
    "Verification",
    "VerificationStatus",
    # Dead Zone Cache
    "DeadZoneCache",
]
