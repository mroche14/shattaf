"""Invoices router."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..models import User, UserRole
from ..schemas import InvoiceResponse, InvoiceItemResponse
from ..services.invoice import InvoiceService
from ..services.order import OrderService
from ..utils.deps import get_current_active_user

router = APIRouter(prefix="/invoices", tags=["Invoices"])


@router.post("/order/{order_id}", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
async def create_invoice(
    order_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Create invoice for a completed order (admin only)."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    service = InvoiceService(session)
    invoice = await service.create_invoice(order_id)

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create invoice",
        )

    return invoice


@router.get("/order/{order_id}", response_model=InvoiceResponse)
async def get_invoice_by_order(
    order_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Get invoice for an order."""
    order_service = OrderService(session)
    order = await order_service.get_order(order_id)

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    # Verify access
    if order.customer_id != current_user.id and order.plumber_id != current_user.id:
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )

    service = InvoiceService(session)
    invoice = await service.get_invoice_by_order(order_id)

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found",
        )

    return invoice


@router.get("/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(
    invoice_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Get an invoice."""
    service = InvoiceService(session)
    invoice = await service.get_invoice(invoice_id)

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found",
        )

    # Verify access
    if invoice.customer_id != current_user.id and invoice.plumber_id != current_user.id:
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )

    return invoice


@router.get("/{invoice_id}/items", response_model=list[InvoiceItemResponse])
async def get_invoice_items(
    invoice_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list:
    """Get invoice line items."""
    service = InvoiceService(session)
    invoice = await service.get_invoice(invoice_id)

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found",
        )

    # Verify access
    if invoice.customer_id != current_user.id and invoice.plumber_id != current_user.id:
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )

    return await service.get_invoice_items(invoice_id)


@router.post("/{invoice_id}/issue", response_model=InvoiceResponse)
async def issue_invoice(
    invoice_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Issue an invoice (admin only)."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    service = InvoiceService(session)
    invoice = await service.issue_invoice(invoice_id)

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot issue invoice",
        )

    return invoice


@router.get("/{invoice_id}/pdf")
async def download_invoice_pdf(
    invoice_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Download invoice PDF."""
    service = InvoiceService(session)
    invoice = await service.get_invoice(invoice_id)

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found",
        )

    # Verify access
    if invoice.customer_id != current_user.id and invoice.plumber_id != current_user.id:
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )

    if not invoice.pdf_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PDF not generated yet",
        )

    return {"pdf_url": invoice.pdf_url}
