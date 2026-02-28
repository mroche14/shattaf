"""Admin API endpoints for plumber prospects."""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..models.user import User
from ..models.prospect import ContactStatus
from ..schemas.prospect import (
    ProspectResponse,
    ProspectUpdate,
    ProspectBulkStatusUpdate,
    ProspectFilters,
    ProspectStats,
    ProspectListResponse,
    ImportResult,
)
from ..services.prospect import ProspectService
from ..utils.deps import get_current_admin_user

router = APIRouter(prefix="/admin/prospects", tags=["admin-prospects"])


@router.get("", response_model=ProspectListResponse)
async def list_prospects(
    departement: Optional[str] = Query(None),
    contact_status: Optional[ContactStatus] = Query(None),
    individuel: Optional[bool] = Query(None),
    has_telephone: Optional[bool] = Query(None),
    has_email: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_admin_user),
):
    """List prospects with filters and pagination."""
    service = ProspectService(session)

    filters = ProspectFilters(
        departement=departement,
        contact_status=contact_status,
        individuel=individuel,
        has_telephone=has_telephone,
        has_email=has_email,
        search=search,
        page=page,
        limit=limit,
    )

    items, total = await service.list_prospects(filters)
    pages = (total + limit - 1) // limit

    return ProspectListResponse(
        items=[ProspectResponse.model_validate(p) for p in items],
        total=total,
        page=page,
        limit=limit,
        pages=pages,
    )


@router.get("/stats", response_model=ProspectStats)
async def get_prospect_stats(
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_admin_user),
):
    """Get prospect statistics."""
    service = ProspectService(session)
    return await service.get_stats()


@router.get("/{prospect_id}", response_model=ProspectResponse)
async def get_prospect(
    prospect_id: UUID,
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_admin_user),
):
    """Get a single prospect by ID."""
    service = ProspectService(session)
    prospect = await service.get_prospect(prospect_id)

    if not prospect:
        raise HTTPException(status_code=404, detail="Prospect not found")

    return ProspectResponse.model_validate(prospect)


@router.patch("/{prospect_id}", response_model=ProspectResponse)
async def update_prospect(
    prospect_id: UUID,
    data: ProspectUpdate,
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_admin_user),
):
    """Update prospect contact status and notes."""
    service = ProspectService(session)

    prospect = await service.update_prospect(
        prospect_id,
        contact_status=data.contact_status,
        contact_notes=data.contact_notes,
    )

    if not prospect:
        raise HTTPException(status_code=404, detail="Prospect not found")

    return ProspectResponse.model_validate(prospect)


@router.post("/bulk-status")
async def bulk_update_status(
    data: ProspectBulkStatusUpdate,
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_admin_user),
):
    """Update status for multiple prospects."""
    service = ProspectService(session)

    updated = await service.bulk_update_status(
        prospect_ids=data.prospect_ids,
        contact_status=data.contact_status,
    )

    return {"updated": updated}


@router.post("/import", response_model=ImportResult)
async def import_prospects(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_admin_user),
):
    """Import prospects from CSV file."""
    if not file.filename or not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    content = await file.read()

    # Try different encodings
    csv_content = None
    for encoding in ['utf-8', 'latin-1', 'cp1252']:
        try:
            csv_content = content.decode(encoding)
            break
        except UnicodeDecodeError:
            continue

    if csv_content is None:
        raise HTTPException(status_code=400, detail="Unable to decode CSV file")

    service = ProspectService(session)
    return await service.import_csv(csv_content)
