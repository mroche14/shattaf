"""SQLModel database models."""

from .user import User, UserRole
from .customer import CustomerProfile
from .plumber import PlumberProfile, PlumberStatus
from .product import Product, ProductCategory
from .pricing import PricingConfig
from .booking import Booking, BookingStatus, ToiletType
from .quote import Quote, QuoteStatus
from .order import Order, OrderItem, OrderStatus, PaymentStatus
from .job import Job, JobStatus, JobPhoto
from .invoice import Invoice, InvoiceItem, InvoiceStatus
from .mandate import Mandate, MandateStatus
from .ticket import SupportTicket, TicketStatus, TicketCategory
from .audit import AuditLog
from .prospect import PlumberProspect, ContactStatus

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
    # Booking
    "Booking",
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
    # Job
    "Job",
    "JobStatus",
    "JobPhoto",
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
]
