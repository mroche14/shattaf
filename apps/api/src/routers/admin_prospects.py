"""Admin API endpoints for plumber prospects."""

import asyncio
import logging
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.user import User
from ..models.prospect import ContactStatus, PlumberProspect
from ..schemas.prospect import (
    ProspectResponse,
    ProspectUpdate,
    ProspectBulkStatusUpdate,
    ProspectFilters,
    ProspectStats,
    ProspectListResponse,
    ProspectMapItem,
    ImportResult,
    GeocodeResult,
)
from ..services.prospect import ProspectService
from ..services.geocoding import GeocodingService
from .. import database
from ..database import get_session
from ..utils.deps import get_current_admin_user

logger = logging.getLogger(__name__)

# Lock to prevent concurrent geocoding runs
_geocoding_lock = asyncio.Lock()

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


async def _run_geocoding_background():
    """Background task: geocode all un-geocoded prospects."""
    if _geocoding_lock.locked():
        return  # Already running
    async with _geocoding_lock:
        from sqlalchemy import select, func

        async with database.async_session_factory() as session:
            count_result = await session.execute(
                select(func.count()).select_from(PlumberProspect).where(
                    PlumberProspect.geocoded_at.is_(None),
                    PlumberProspect.ville.is_not(None),
                )
            )
            pending = count_result.scalar() or 0
            if pending == 0:
                return

            logger.info(f"Auto-geocoding {pending} prospects in background...")
            result = await session.execute(
                select(PlumberProspect).where(PlumberProspect.geocoded_at.is_(None))
            )
            prospects = list(result.scalars().all())

            geocoding_service = GeocodingService(session)
            stats = await geocoding_service.geocode_prospects(prospects)
            logger.info(f"Auto-geocoding done: {stats}")


@router.post("/geocode", response_model=GeocodeResult)
async def geocode_prospects(
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_admin_user),
):
    """Trigger batch geocoding of all un-geocoded prospects."""
    from sqlalchemy import select

    result = await session.execute(
        select(PlumberProspect).where(PlumberProspect.geocoded_at.is_(None))
    )
    prospects = list(result.scalars().all())

    if not prospects:
        return GeocodeResult(geocoded=0, failed=0, skipped=0)

    geocoding_service = GeocodingService(session)
    stats = await geocoding_service.geocode_prospects(prospects)

    return GeocodeResult(
        geocoded=stats.get("geocoded", 0),
        failed=stats.get("failed", 0),
        skipped=stats.get("skipped", 0),
    )


@router.get("/map", response_model=list[ProspectMapItem])
async def get_prospects_map(
    background_tasks: BackgroundTasks,
    departement: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_admin_user),
):
    """Get geocoded prospects for map display. Auto-geocodes pending prospects in background."""
    from sqlalchemy import select, func

    # Check if there are un-geocoded prospects and trigger background geocoding
    count_result = await session.execute(
        select(func.count()).select_from(PlumberProspect).where(
            PlumberProspect.geocoded_at.is_(None),
            PlumberProspect.ville.is_not(None),
        )
    )
    pending = count_result.scalar() or 0
    if pending > 0:
        background_tasks.add_task(_run_geocoding_background)

    # Return already-geocoded prospects
    query = select(PlumberProspect).where(
        PlumberProspect.latitude.is_not(None),
        PlumberProspect.longitude.is_not(None),
    )

    if departement:
        query = query.where(PlumberProspect.departement == departement)

    result = await session.execute(query)
    prospects = result.scalars().all()

    items = []
    for p in prospects:
        name = (
            p.raison_sociale
            or " ".join(filter(None, [p.prenom_dirigeant, p.nom_dirigeant]))
            or "Sans nom"
        )
        items.append(
            ProspectMapItem(
                id=p.id,
                lat=p.latitude,
                lng=p.longitude,
                name=name,
                departement=p.departement,
                contact_status=p.contact_status,
                individuel=p.individuel,
                telephone=p.telephone,
                email=p.email,
                ville=p.ville,
            )
        )

    return items


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
