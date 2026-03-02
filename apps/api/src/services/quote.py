"""Quote service."""

from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from ..config import get_settings
from ..models import Quote, QuoteStatus, Booking, BookingType, BookingStatus, Product
from ..utils.db import uuid_column_eq

settings = get_settings()

# Default VAT rate for DOM-TOM (8.5%)
DEFAULT_VAT_RATE = 0.085


class QuoteService:
    """Quote management service."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_quote(
        self,
        booking_id: UUID,
        plumber_id: UUID,
        installation_price: int,
        proposed_date: datetime,
        proposed_time_slot: str,
        estimated_duration_minutes: int = 45,
        plumber_notes: Optional[str] = None,
        product_price: Optional[int] = None,
    ) -> Optional[Quote]:
        """Create a quote for a booking.

        For product bookings: product_price is auto-calculated from the product.
        For marketplace bookings: product_price is 0 (labor-only), or can be
        provided by the plumber to cover materials.
        """
        # Get booking
        result = await self.session.execute(
            select(Booking).where(uuid_column_eq(Booking.id, booking_id))
        )
        booking = result.scalar_one_or_none()
        if not booking:
            return None

        vat_rate = DEFAULT_VAT_RATE

        if booking.type == BookingType.MARKETPLACE:
            # Marketplace: plumber defines full pricing, no product lookup
            final_product_price = product_price or 0
        else:
            # Product booking: lookup product for price
            if not booking.product_id:
                return None

            result = await self.session.execute(
                select(Product).where(uuid_column_eq(Product.id, booking.product_id))
            )
            product = result.scalar_one_or_none()
            if not product:
                return None

            final_product_price = product.price_b2c
            vat_rate = float(product.vat_rate) / 100

        # Calculate platform fee (on installation only)
        platform_fee = int(installation_price * settings.STRIPE_PLATFORM_FEE_PERCENT / 100)

        # Calculate totals
        subtotal = final_product_price + installation_price
        vat_amount = int(subtotal * vat_rate)
        total_price = subtotal + vat_amount

        quote = Quote(
            booking_id=booking_id,
            plumber_id=plumber_id,
            installation_price=installation_price,
            product_price=final_product_price,
            platform_fee=platform_fee,
            total_price=total_price,
            vat_amount=vat_amount,
            price_excluding_vat=subtotal,
            proposed_date=proposed_date,
            proposed_time_slot=proposed_time_slot,
            estimated_duration_minutes=estimated_duration_minutes,
            valid_until=datetime.utcnow() + timedelta(hours=48),
            plumber_notes=plumber_notes,
        )

        self.session.add(quote)

        # Update booking status
        booking.status = BookingStatus.QUOTED

        await self.session.commit()
        await self.session.refresh(quote)
        return quote

    async def get_quote(self, quote_id: UUID) -> Optional[Quote]:
        """Get quote by ID."""
        result = await self.session.execute(
            select(Quote).where(uuid_column_eq(Quote.id, quote_id))
        )
        return result.scalar_one_or_none()

    async def get_booking_quotes(self, booking_id: UUID) -> list[Quote]:
        """Get all quotes for a booking."""
        result = await self.session.execute(
            select(Quote)
            .where(uuid_column_eq(Quote.booking_id, booking_id))
            .order_by(Quote.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_plumber_quotes(
        self,
        plumber_id: UUID,
        status: Optional[QuoteStatus] = None,
    ) -> list[Quote]:
        """Get quotes by a plumber."""
        query = select(Quote).where(uuid_column_eq(Quote.plumber_id, plumber_id))

        if status:
            query = query.where(Quote.status == status)

        query = query.order_by(Quote.created_at.desc())
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def accept_quote(
        self,
        quote_id: UUID,
        customer_notes: Optional[str] = None,
    ) -> Optional[Quote]:
        """Customer accepts a quote."""
        quote = await self.get_quote(quote_id)
        if not quote:
            return None

        if quote.status != QuoteStatus.PENDING:
            return None

        if datetime.utcnow() > quote.valid_until:
            quote.status = QuoteStatus.EXPIRED
            await self.session.commit()
            return None

        quote.status = QuoteStatus.ACCEPTED
        quote.customer_response_at = datetime.utcnow()
        quote.customer_notes = customer_notes

        # Update booking status
        result = await self.session.execute(
            select(Booking).where(uuid_column_eq(Booking.id, quote.booking_id))
        )
        booking = result.scalar_one_or_none()
        if booking:
            booking.status = BookingStatus.ACCEPTED

        await self.session.commit()
        await self.session.refresh(quote)
        return quote

    async def reject_quote(self, quote_id: UUID) -> Optional[Quote]:
        """Customer rejects a quote."""
        quote = await self.get_quote(quote_id)
        if not quote or quote.status != QuoteStatus.PENDING:
            return None

        quote.status = QuoteStatus.REJECTED
        quote.customer_response_at = datetime.utcnow()

        await self.session.commit()
        await self.session.refresh(quote)
        return quote
