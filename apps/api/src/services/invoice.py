"""Invoice service."""

from datetime import date, datetime, timedelta
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from ..models import Invoice, InvoiceItem, InvoiceStatus, Order, Booking, User, PlumberProfile
from ..utils.db import uuid_column_eq


class InvoiceService:
    """Invoice generation service."""

    def __init__(self, session: AsyncSession):
        self.session = session

    def _generate_invoice_number(self) -> str:
        """Generate unique invoice number."""
        year = datetime.utcnow().year
        unique_id = str(uuid4())[:8].upper()
        return f"FAC-{year}-{unique_id}"

    async def create_invoice(self, order_id: UUID) -> Optional[Invoice]:
        """Create invoice for a completed order."""
        # Get order
        result = await self.session.execute(
            select(Order).where(uuid_column_eq(Order.id, order_id))
        )
        order = result.scalar_one_or_none()
        if not order:
            return None

        # Get customer
        result = await self.session.execute(
            select(User).where(uuid_column_eq(User.id, order.customer_id))
        )
        customer = result.scalar_one_or_none()
        if not customer:
            return None

        # Get plumber and profile
        result = await self.session.execute(
            select(User).where(uuid_column_eq(User.id, order.plumber_id))
        )
        plumber = result.scalar_one_or_none()
        if not plumber:
            return None

        result = await self.session.execute(
            select(PlumberProfile).where(uuid_column_eq(PlumberProfile.user_id, order.plumber_id))
        )
        plumber_profile = result.scalar_one_or_none()
        if not plumber_profile:
            return None

        # Calculate VAT (8.5% for Guadeloupe)
        vat_rate = 0.085
        vat_products = int(order.product_subtotal * vat_rate)
        vat_installation = int(order.installation_subtotal * vat_rate)

        invoice = Invoice(
            invoice_number=self._generate_invoice_number(),
            order_id=order.id,
            status=InvoiceStatus.DRAFT,
            # Issuer (platform)
            issuer_name="Oasis Shattaf",
            issuer_siren="XXX XXX XXX",  # To be filled
            issuer_address="Guadeloupe, France",
            # Customer
            customer_id=customer.id,
            customer_name=customer.full_name,
            customer_address="",  # From booking
            customer_email=customer.email,
            # Plumber
            plumber_id=plumber.id,
            plumber_name=plumber_profile.company_name or plumber.full_name,
            plumber_siren=plumber_profile.siren or "",
            # Dates
            invoice_date=date.today(),
            due_date=date.today() + timedelta(days=30),
            # Amounts
            subtotal_products=order.product_subtotal,
            subtotal_installation=order.installation_subtotal,
            vat_products=vat_products,
            vat_installation=vat_installation,
            total_excluding_vat=order.product_subtotal + order.installation_subtotal,
            total_vat=vat_products + vat_installation,
            total_amount=order.total_amount,
        )

        self.session.add(invoice)
        await self.session.flush()

        # Get booking to determine context-aware descriptions
        booking = None
        if order.booking_id:
            result = await self.session.execute(
                select(Booking).where(uuid_column_eq(Booking.id, order.booking_id))
            )
            booking = result.scalar_one_or_none()

        is_marketplace = booking and hasattr(booking, 'type') and str(booking.type) in ('marketplace', 'MARKETPLACE')
        product_desc = (booking.category or "Intervention plomberie") if is_marketplace else "Produit - Kit complet"
        install_desc = (booking.description or booking.category or "Prestation plomberie") if is_marketplace else "Installation professionnelle"

        # Create Section A item (product/materials)
        product_item = InvoiceItem(
            invoice_id=invoice.id,
            section="A",
            description=product_desc,
            quantity=1,
            unit_price=order.product_subtotal,
            vat_rate="8.5",
            vat_amount=vat_products,
            total_amount=order.product_subtotal + vat_products,
        )
        self.session.add(product_item)

        # Create Section B item (installation/labor)
        install_item = InvoiceItem(
            invoice_id=invoice.id,
            section="B",
            description=install_desc,
            quantity=1,
            unit_price=order.installation_subtotal,
            vat_rate="8.5",
            vat_amount=vat_installation,
            total_amount=order.installation_subtotal + vat_installation,
            plumber_siren=plumber_profile.siren,
        )
        self.session.add(install_item)

        await self.session.commit()
        await self.session.refresh(invoice)
        return invoice

    async def get_invoice(self, invoice_id: UUID) -> Optional[Invoice]:
        """Get invoice by ID."""
        result = await self.session.execute(
            select(Invoice).where(uuid_column_eq(Invoice.id, invoice_id))
        )
        return result.scalar_one_or_none()

    async def get_invoice_by_order(self, order_id: UUID) -> Optional[Invoice]:
        """Get invoice for an order."""
        result = await self.session.execute(
            select(Invoice).where(uuid_column_eq(Invoice.order_id, order_id))
        )
        return result.scalar_one_or_none()

    async def get_invoice_items(self, invoice_id: UUID) -> list[InvoiceItem]:
        """Get items for an invoice."""
        result = await self.session.execute(
            select(InvoiceItem)
            .where(uuid_column_eq(InvoiceItem.invoice_id, invoice_id))
            .order_by(InvoiceItem.section.asc())
        )
        return list(result.scalars().all())

    async def issue_invoice(self, invoice_id: UUID) -> Optional[Invoice]:
        """Mark invoice as issued."""
        invoice = await self.get_invoice(invoice_id)
        if not invoice or invoice.status != InvoiceStatus.DRAFT:
            return None

        invoice.status = InvoiceStatus.ISSUED

        await self.session.commit()
        await self.session.refresh(invoice)
        return invoice

    async def mark_paid(self, invoice_id: UUID) -> Optional[Invoice]:
        """Mark invoice as paid."""
        invoice = await self.get_invoice(invoice_id)
        if not invoice:
            return None

        invoice.status = InvoiceStatus.PAID
        invoice.paid_date = date.today()

        await self.session.commit()
        await self.session.refresh(invoice)
        return invoice
