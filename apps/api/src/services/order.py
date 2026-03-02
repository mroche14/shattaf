"""Order service."""

from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from ..models import (
    Order,
    OrderItem,
    OrderStatus,
    PaymentStatus,
    Quote,
    QuoteStatus,
    Booking,
    Product,
    Mission,
    MissionStatus,
)
from ..utils.db import uuid_column_eq


class OrderService:
    """Order management service."""

    def __init__(self, session: AsyncSession):
        self.session = session

    def _generate_order_number(self) -> str:
        """Generate unique order number."""
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M")
        unique_id = str(uuid4())[:6].upper()
        return f"ORD-{timestamp}-{unique_id}"

    async def create_order_from_quote(self, quote_id: UUID) -> Optional[Order]:
        """Create order from an accepted quote.

        Supports both product bookings (with product_id) and marketplace
        bookings (no product, labor-only or plumber-supplied materials).
        """
        result = await self.session.execute(
            select(Quote).where(uuid_column_eq(Quote.id, quote_id))
        )
        quote = result.scalar_one_or_none()

        if not quote or quote.status != QuoteStatus.ACCEPTED:
            return None

        # Get booking
        result = await self.session.execute(
            select(Booking).where(uuid_column_eq(Booking.id, quote.booking_id))
        )
        booking = result.scalar_one_or_none()
        if not booking:
            return None

        # Get product if this is a product booking
        product = None
        if booking.product_id:
            result = await self.session.execute(
                select(Product).where(uuid_column_eq(Product.id, booking.product_id))
            )
            product = result.scalar_one_or_none()

        # Create order
        order = Order(
            order_number=self._generate_order_number(),
            customer_id=booking.customer_id,
            plumber_id=quote.plumber_id,
            booking_id=booking.id,
            quote_id=quote.id,
            product_subtotal=quote.product_price,
            installation_subtotal=quote.installation_price,
            platform_fee=quote.platform_fee,
            vat_amount=quote.vat_amount,
            total_amount=quote.total_price,
            scheduled_date=quote.proposed_date,
            scheduled_time_slot=quote.proposed_time_slot,
        )
        self.session.add(order)
        await self.session.flush()

        # Create order items
        if product:
            # Product booking: product item + installation item
            product_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                product_sku=product.sku,
                unit_price=quote.product_price,
                quantity=1,
                total_price=quote.product_price,
                is_installation=False,
            )
            self.session.add(product_item)

            installation_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_name=f"Installation - {product.name}",
                product_sku=f"{product.sku}-INST",
                unit_price=quote.installation_price,
                quantity=1,
                total_price=quote.installation_price,
                is_installation=True,
            )
            self.session.add(installation_item)
        else:
            # Marketplace booking: single labor/service item
            if quote.product_price > 0:
                materials_item = OrderItem(
                    order_id=order.id,
                    product_name="Fournitures",
                    product_sku="MARKETPLACE-MAT",
                    unit_price=quote.product_price,
                    quantity=1,
                    total_price=quote.product_price,
                    is_installation=False,
                )
                self.session.add(materials_item)

            labor_item = OrderItem(
                order_id=order.id,
                product_name=booking.category or "Intervention plomberie",
                product_sku="MARKETPLACE-LABOR",
                unit_price=quote.installation_price,
                quantity=1,
                total_price=quote.installation_price,
                is_installation=True,
            )
            self.session.add(labor_item)

        # Create mission
        mission = Mission(
            order_id=order.id,
            plumber_id=quote.plumber_id,
            status=MissionStatus.SCHEDULED,
        )
        self.session.add(mission)

        await self.session.commit()
        await self.session.refresh(order)
        return order

    async def get_order(self, order_id: UUID) -> Optional[Order]:
        """Get order by ID."""
        result = await self.session.execute(
            select(Order).where(uuid_column_eq(Order.id, order_id))
        )
        return result.scalar_one_or_none()

    async def get_order_by_number(self, order_number: str) -> Optional[Order]:
        """Get order by order number."""
        result = await self.session.execute(
            select(Order).where(Order.order_number == order_number)
        )
        return result.scalar_one_or_none()

    async def get_customer_orders(
        self,
        customer_id: UUID,
        status: Optional[OrderStatus] = None,
    ) -> list[Order]:
        """Get orders for a customer."""
        query = select(Order).where(uuid_column_eq(Order.customer_id, customer_id))

        if status:
            query = query.where(Order.status == status)

        query = query.order_by(Order.created_at.desc())
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_plumber_orders(
        self,
        plumber_id: UUID,
        status: Optional[OrderStatus] = None,
    ) -> list[Order]:
        """Get orders assigned to a plumber."""
        query = select(Order).where(uuid_column_eq(Order.plumber_id, plumber_id))

        if status:
            query = query.where(Order.status == status)

        query = query.order_by(Order.scheduled_date.asc())
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_order_items(self, order_id: UUID) -> list[OrderItem]:
        """Get items for an order."""
        result = await self.session.execute(
            select(OrderItem).where(uuid_column_eq(OrderItem.order_id, order_id))
        )
        return list(result.scalars().all())

    async def update_payment_status(
        self,
        order_id: UUID,
        payment_status: PaymentStatus,
        stripe_payment_intent_id: Optional[str] = None,
    ) -> Optional[Order]:
        """Update order payment status."""
        order = await self.get_order(order_id)
        if not order:
            return None

        order.payment_status = payment_status
        if stripe_payment_intent_id:
            order.stripe_payment_intent_id = stripe_payment_intent_id

        if payment_status == PaymentStatus.AUTHORIZED:
            order.status = OrderStatus.PAID

        await self.session.commit()
        await self.session.refresh(order)
        return order

    async def complete_order(
        self,
        order_id: UUID,
        rating: Optional[int] = None,
        review: Optional[str] = None,
    ) -> Optional[Order]:
        """Mark order as completed."""
        order = await self.get_order(order_id)
        if not order:
            return None

        order.status = OrderStatus.COMPLETED
        order.completed_at = datetime.utcnow()
        order.customer_rating = rating
        order.customer_review = review

        await self.session.commit()
        await self.session.refresh(order)
        return order
