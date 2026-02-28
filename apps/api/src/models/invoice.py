"""Invoice model."""

from datetime import date, datetime
from enum import Enum
from typing import Optional
from uuid import UUID
from sqlmodel import Field

from .base import BaseModel


class InvoiceStatus(str, Enum):
    """Invoice status."""

    DRAFT = "draft"
    ISSUED = "issued"
    SENT = "sent"
    PAID = "paid"
    CANCELLED = "cancelled"


class Invoice(BaseModel, table=True):
    """Unified invoice (product + installation)."""

    __tablename__ = "invoices"

    invoice_number: str = Field(unique=True, index=True)
    order_id: UUID = Field(foreign_key="orders.id", unique=True, index=True)
    status: InvoiceStatus = Field(default=InvoiceStatus.DRAFT)

    # Issuer (Shattaf as mandataire)
    issuer_name: str = "Oasis Shattaf"
    issuer_siren: str = ""
    issuer_address: str = ""
    issuer_vat_number: Optional[str] = None

    # Customer
    customer_id: UUID = Field(foreign_key="users.id")
    customer_name: str
    customer_address: str
    customer_email: str

    # Plumber (for Section B - installation)
    plumber_id: UUID = Field(foreign_key="users.id")
    plumber_name: str
    plumber_siren: str
    plumber_address: Optional[str] = None

    # Dates
    invoice_date: date = Field(default_factory=date.today)
    due_date: date
    paid_date: Optional[date] = None

    # Totals (in EUR cents)
    subtotal_products: int  # Section A
    subtotal_installation: int  # Section B
    vat_products: int
    vat_installation: int
    total_excluding_vat: int
    total_vat: int
    total_amount: int

    # Alias properties for admin router
    @property
    def product_amount(self) -> int:
        return self.subtotal_products

    @property
    def installation_amount(self) -> int:
        return self.subtotal_installation

    @property
    def vat_amount(self) -> int:
        return self.total_vat

    @property
    def issued_at(self) -> datetime:
        return datetime.combine(self.invoice_date, datetime.min.time())

    @property
    def paid_at(self) -> Optional[datetime]:
        return datetime.combine(self.paid_date, datetime.min.time()) if self.paid_date else None

    # VAT rate used
    vat_rate: str = "8.5"  # Guadeloupe

    # Legal mentions (BOFiP compliant)
    mandate_mention: str = Field(
        default="Facture émise par Oasis Shattaf en qualité de mandataire, "
        "pour le compte du prestataire identifié en Section B, "
        "conformément au mandat de facturation signé."
    )

    # PDF
    pdf_url: Optional[str] = None
    pdf_generated_at: Optional[datetime] = None

    # Email
    sent_to_customer_at: Optional[datetime] = None
    sent_to_plumber_at: Optional[datetime] = None


class InvoiceItem(BaseModel, table=True):
    """Invoice line item."""

    __tablename__ = "invoice_items"

    invoice_id: UUID = Field(foreign_key="invoices.id", index=True)

    # Section A (product) or Section B (installation)
    section: str  # "A" or "B"

    description: str
    quantity: int = Field(default=1)
    unit_price: int  # EUR cents
    vat_rate: str = "8.5"
    vat_amount: int
    total_amount: int

    # For Section B
    plumber_siren: Optional[str] = None
