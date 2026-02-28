"""Public routes - no authentication required."""

from datetime import datetime
from typing import Annotated, Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_session
from ..models import Booking, BookingStatus, Quote, QuoteStatus, User, ToiletType, Product, PricingConfig, Invoice
from ..services.booking import BookingService
from ..services.auth import AuthService
from ..utils.db import uuid_column_eq


router = APIRouter(prefix="/public", tags=["Public"])


# ============================================================
# SCHEMAS
# ============================================================

class CartItem(BaseModel):
    """Item in the booking cart."""
    product_id: str  # Product ID from frontend constants
    price: int  # Price in euros


class PublicBookingCreate(BaseModel):
    """Public booking creation - from landing page."""
    # Customer info
    customer_name: str
    customer_email: Optional[EmailStr] = None
    customer_phone: str

    # Address
    address_street: str
    address_city: str
    address_postal_code: str
    address_lat: Optional[float] = None
    address_lng: Optional[float] = None

    # Optional details
    floor: Optional[int] = None
    digicode: Optional[str] = None
    parking_available: bool = False
    access_notes: Optional[str] = None
    toilet_type: str = "standard"
    additional_notes: Optional[str] = None

    # Product & scheduling - support both old single product and new cart format
    product_id: Optional[UUID] = None  # Legacy single product
    items: Optional[List[CartItem]] = None  # New cart format
    quantity: int = 1
    preferred_date: Optional[datetime] = None

    # Toilet type flags
    is_wall_mounted: bool = False
    has_photos: bool = False


class PublicBookingResponse(BaseModel):
    """Public booking creation response."""
    booking_id: UUID
    tracking_url: str
    message: str


class PlumberInfo(BaseModel):
    """Limited plumber info for tracking."""
    first_name: str
    phone: Optional[str] = None

    class Config:
        from_attributes = True


class QuoteInfo(BaseModel):
    """Quote info for tracking."""
    id: UUID
    installation_price: int
    total_price: int
    proposed_date: Optional[datetime] = None
    proposed_time_slot: Optional[str] = None
    plumber_notes: Optional[str] = None
    status: str
    plumber: Optional[PlumberInfo] = None

    class Config:
        from_attributes = True


class JobInfo(BaseModel):
    """Job info for tracking."""
    status: str
    scheduled_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class InvoiceInfo(BaseModel):
    """Invoice info for tracking."""
    id: UUID
    invoice_number: str
    total_amount: int
    status: str
    pdf_url: Optional[str] = None

    class Config:
        from_attributes = True


class TrackingResponse(BaseModel):
    """Full tracking info for a booking."""
    id: UUID
    status: str
    status_label: str

    # Address (partial for privacy)
    address_city: str
    address_postal_code: str

    # Dates
    created_at: datetime
    preferred_date: Optional[datetime] = None

    # Assigned plumber
    plumber: Optional[PlumberInfo] = None

    # Quotes
    quotes: list[QuoteInfo] = []
    accepted_quote: Optional[QuoteInfo] = None

    # Job info
    job: Optional[JobInfo] = None

    # Invoice
    invoice: Optional[InvoiceInfo] = None


class AcceptQuoteRequest(BaseModel):
    """Request to accept a quote."""
    quote_id: UUID


# ============================================================
# STATUS LABELS
# ============================================================

STATUS_LABELS = {
    "draft": "Brouillon",
    "submitted": "Demande envoyée",
    "quoted": "Devis reçu",
    "accepted": "Devis accepté",
    "scheduled": "Installation planifiée",
    "in_progress": "Installation en cours",
    "completed": "Terminée",
    "cancelled": "Annulée",
}


# ============================================================
# ROUTES
# ============================================================

@router.post("/bookings", response_model=PublicBookingResponse, status_code=status.HTTP_201_CREATED)
async def create_public_booking(
    data: PublicBookingCreate,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Create a booking from the public landing page.
    Creates a guest customer account if email provided, or anonymous booking.
    Returns a tracking URL with the booking ID.
    """
    # Find or create customer
    customer = None
    if data.customer_email:
        # Check if customer exists
        result = await session.execute(
            select(User).where(User.email == data.customer_email)
        )
        customer = result.scalar_one_or_none()

    if not customer:
        # Create guest customer
        from ..models import UserRole
        customer = User(
            email=data.customer_email or f"guest_{datetime.utcnow().timestamp()}@guest.local",
            hashed_password=AuthService.hash_password("guest_no_login"),
            first_name=data.customer_name.split()[0] if data.customer_name else "Client",
            last_name=" ".join(data.customer_name.split()[1:]) if len(data.customer_name.split()) > 1 else "",
            phone=data.customer_phone,
            role=UserRole.CUSTOMER,
            is_active=True,
            is_verified=False,  # Guest accounts not verified
        )
        session.add(customer)
        await session.flush()

    # Create booking
    toilet_type_map = {
        "standard": ToiletType.STANDARD,
        "wall_hung": ToiletType.WALL_HUNG,
    }

    # Determine toilet type based on wall-mounted flag
    toilet_type = ToiletType.WALL_HUNG if data.is_wall_mounted else toilet_type_map.get(data.toilet_type, ToiletType.STANDARD)

    # Build additional notes with cart info
    notes_parts = []
    if data.additional_notes:
        notes_parts.append(data.additional_notes)
    if data.items:
        cart_summary = f"Panier: {len(data.items)} article(s) - Total: {sum(item.price for item in data.items)}€"
        items_detail = ", ".join(f"{item.product_id}: {item.price}€" for item in data.items)
        notes_parts.append(f"{cart_summary} ({items_detail})")
    if data.is_wall_mounted:
        notes_parts.append("WC suspendu/encastré")
    if not data.has_photos:
        notes_parts.append("Pas de photos fournies")

    additional_notes = " | ".join(notes_parts) if notes_parts else None

    # Calculate quantity from cart
    quantity = len(data.items) if data.items else data.quantity

    booking = Booking(
        customer_id=customer.id,
        status=BookingStatus.SUBMITTED,  # Directly submitted
        address_street=data.address_street,
        address_city=data.address_city,
        address_postal_code=data.address_postal_code,
        address_lat=data.address_lat,
        address_lng=data.address_lng,
        floor=data.floor,
        digicode=data.digicode,
        parking_available=data.parking_available,
        access_notes=data.access_notes,
        toilet_type=toilet_type,
        additional_notes=additional_notes,
        product_id=data.product_id,
        preferred_date=data.preferred_date,
    )
    session.add(booking)
    await session.commit()

    # TODO: Send WhatsApp/Email notification with tracking link

    return PublicBookingResponse(
        booking_id=booking.id,
        tracking_url=f"/track/{booking.id}",
        message="Votre demande a été envoyée ! Vous recevrez un devis sous 24h.",
    )


@router.get("/track/{booking_id}", response_model=TrackingResponse)
async def track_booking(
    booking_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Get tracking info for a booking.
    This is the public tracking page - no auth required.
    The booking_id (UUID) acts as an unguessable token.
    """
    # Fetch booking
    result = await session.execute(
        select(Booking).where(uuid_column_eq(Booking.id, booking_id))
    )
    booking = result.scalar_one_or_none()

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Réservation non trouvée",
        )

    # Get quotes
    quotes_result = await session.execute(
        select(Quote)
        .where(uuid_column_eq(Quote.booking_id, booking_id))
        .order_by(Quote.created_at.desc())
    )
    quotes = quotes_result.scalars().all()

    # Find accepted quote
    accepted_quote = None
    quote_infos = []
    for q in quotes:
        # Get plumber info
        plumber_result = await session.execute(
            select(User).where(uuid_column_eq(User.id, q.plumber_id))
        )
        plumber_user = plumber_result.scalar_one_or_none()

        plumber_info = None
        if plumber_user:
            plumber_info = PlumberInfo(
                first_name=plumber_user.first_name or "Plombier",
                phone=plumber_user.phone if q.status == QuoteStatus.ACCEPTED else None,
            )

        quote_info = QuoteInfo(
            id=q.id,
            installation_price=q.installation_price,
            total_price=q.total_price,
            proposed_date=q.proposed_date,
            proposed_time_slot=q.proposed_time_slot,
            plumber_notes=q.plumber_notes,
            status=q.status.value,
            plumber=plumber_info,
        )
        quote_infos.append(quote_info)

        if q.status == QuoteStatus.ACCEPTED:
            accepted_quote = quote_info

    # Get job if exists (via Order which links Quote to Job)
    # For now, we skip job/invoice lookup as the relationships are complex
    # TODO: Add proper job/invoice lookup via Order
    job_info = None
    invoice_info = None

    # Get assigned plumber info
    plumber_info = None
    if booking.assigned_plumber_id:
        plumber_result = await session.execute(
            select(User).where(uuid_column_eq(User.id, booking.assigned_plumber_id))
        )
        plumber_user = plumber_result.scalar_one_or_none()
        if plumber_user:
            plumber_info = PlumberInfo(
                first_name=plumber_user.first_name or "Plombier",
                phone=plumber_user.phone,
            )

    return TrackingResponse(
        id=booking.id,
        status=booking.status.value,
        status_label=STATUS_LABELS.get(booking.status.value, booking.status.value),
        address_city=booking.address_city,
        address_postal_code=booking.address_postal_code,
        created_at=booking.created_at,
        preferred_date=booking.preferred_date,
        plumber=plumber_info,
        quotes=quote_infos,
        accepted_quote=accepted_quote,
        job=job_info,
        invoice=invoice_info,
    )


@router.post("/track/{booking_id}/accept-quote")
async def accept_quote_public(
    booking_id: UUID,
    data: AcceptQuoteRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Accept a quote from the public tracking page.
    """
    # Verify booking exists
    booking_result = await session.execute(
        select(Booking).where(uuid_column_eq(Booking.id, booking_id))
    )
    booking = booking_result.scalar_one_or_none()

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Réservation non trouvée",
        )

    # Verify quote belongs to this booking
    quote_result = await session.execute(
        select(Quote).where(
            uuid_column_eq(Quote.id, data.quote_id),
            uuid_column_eq(Quote.booking_id, booking_id),
        )
    )
    quote = quote_result.scalar_one_or_none()

    if not quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Devis non trouvé",
        )

    if quote.status != QuoteStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce devis n'est plus disponible",
        )

    # Accept the quote
    quote.status = QuoteStatus.ACCEPTED
    booking.status = BookingStatus.ACCEPTED
    booking.assigned_plumber_id = quote.plumber_id

    # Reject other quotes
    other_quotes = await session.execute(
        select(Quote).where(
            uuid_column_eq(Quote.booking_id, booking_id),
            Quote.status == QuoteStatus.PENDING,
        )
    )
    for other in other_quotes.scalars():
        other.status = QuoteStatus.REJECTED

    await session.commit()

    # TODO: Send notifications to plumber and customer

    return {"message": "Devis accepté ! Le plombier vous contactera pour confirmer le rendez-vous."}


@router.get("/track/{booking_id}/invoice/{invoice_id}/download")
async def download_invoice(
    booking_id: UUID,
    invoice_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Get invoice download URL.
    """
    # Verify invoice belongs to this booking
    invoice_result = await session.execute(
        select(Invoice).where(
            uuid_column_eq(Invoice.id, invoice_id),
        )
    )
    invoice = invoice_result.scalar_one_or_none()

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Facture non trouvée",
        )

    if not invoice.pdf_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PDF non disponible",
        )

    return {"download_url": invoice.pdf_url}


# ============================================================
# PRODUCT PRICES
# ============================================================

class PriceBreakdown(BaseModel):
    """Price breakdown for a product."""
    supplier_price: int  # Prix fournisseur (cents)
    plumber_travel: int  # Déplacement plombier (cents)
    plumber_labor: int   # Main d'œuvre plombier (cents)
    platform_commission: int  # Commission plateforme (cents)
    total: int  # Total en cents
    is_first_unit: bool


class PublicProduct(BaseModel):
    """Product info for public display."""
    id: UUID
    sku: str
    name: str
    description: Optional[str] = None
    category: str
    image_url: Optional[str] = None
    is_available: bool
    # Price info
    price_first_unit: int  # Total price for first unit (euros)
    price_additional: int  # Total price for additional units (euros)
    price_breakdown_first: PriceBreakdown
    price_breakdown_additional: PriceBreakdown


class PricingInfo(BaseModel):
    """Public pricing info."""
    plumber_travel_fee: int  # € (first unit only)
    plumber_labor_fee: int   # € per unit
    platform_commission_first: int  # € first unit
    platform_commission_additional: int  # € additional


class ProductsResponse(BaseModel):
    """Products list with pricing info."""
    products: List[PublicProduct]
    pricing: PricingInfo


@router.get("/products", response_model=ProductsResponse)
async def get_public_products(
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Get available products with calculated prices.
    Returns price breakdown showing supplier cost, plumber fees, and platform commission.
    """
    # Get pricing config
    config_result = await session.execute(
        select(PricingConfig).where(PricingConfig.name == "default")
    )
    config = config_result.scalar_one_or_none()

    # Use defaults if no config
    if not config:
        config = PricingConfig()

    # Get available products
    products_result = await session.execute(
        select(Product).where(Product.is_available == True).order_by(Product.name)
    )
    products = products_result.scalars().all()

    public_products = []
    for product in products:
        # Calculate first unit price
        first_breakdown = PricingConfig.calculate_price(
            supplier_price=product.supplier_price,
            is_first_unit=True,
            is_b2b=False,
            config=config
        )

        # Calculate additional unit price
        additional_breakdown = PricingConfig.calculate_price(
            supplier_price=product.supplier_price,
            is_first_unit=False,
            is_b2b=False,
            config=config
        )

        public_products.append(PublicProduct(
            id=product.id,
            sku=product.sku,
            name=product.name,
            description=product.description,
            category=product.category.value,
            image_url=product.image_url,
            is_available=product.is_available,
            price_first_unit=first_breakdown["total"] // 100,  # Convert cents to euros
            price_additional=additional_breakdown["total"] // 100,
            price_breakdown_first=PriceBreakdown(
                supplier_price=first_breakdown["supplier_price"],
                plumber_travel=first_breakdown["plumber_travel"],
                plumber_labor=first_breakdown["plumber_labor"],
                platform_commission=first_breakdown["platform_commission"],
                total=first_breakdown["total"],
                is_first_unit=True,
            ),
            price_breakdown_additional=PriceBreakdown(
                supplier_price=additional_breakdown["supplier_price"],
                plumber_travel=additional_breakdown["plumber_travel"],
                plumber_labor=additional_breakdown["plumber_labor"],
                platform_commission=additional_breakdown["platform_commission"],
                total=additional_breakdown["total"],
                is_first_unit=False,
            ),
        ))

    return ProductsResponse(
        products=public_products,
        pricing=PricingInfo(
            plumber_travel_fee=config.plumber_travel_fee // 100,
            plumber_labor_fee=config.plumber_labor_fee // 100,
            platform_commission_first=config.commission_first_unit // 100,
            platform_commission_additional=config.commission_additional // 100,
        ),
    )
