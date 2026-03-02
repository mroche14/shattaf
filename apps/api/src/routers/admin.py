"""Admin API endpoints."""

from typing import Optional, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel

from ..database import get_session
from ..models.user import User
from ..models.plumber import PlumberProfile, PlumberStatus, Department
from ..models.customer import CustomerProfile
from ..models.booking import Booking, BookingStatus
from ..models.order import Order, OrderStatus
from ..models.job import Job, JobStatus
from ..models.invoice import Invoice
from ..models.product import Product
from ..models.pricing import PricingConfig
from ..models.audit import AuditLog
from ..utils.deps import get_current_admin_user

router = APIRouter(prefix="/admin", tags=["admin"])


# ============== Schemas ==============

class DepartmentStats(BaseModel):
    department: str
    plumbers: int
    bookings: int
    revenue: int


class DashboardStats(BaseModel):
    totalPlumbers: int
    activePlumbers: int
    totalCustomers: int
    totalBookings: int
    pendingBookings: int
    totalOrders: int
    totalRevenue: int
    todayJobs: int
    completedJobs: int
    byDepartment: List[DepartmentStats]


class PlumberLocationResponse(BaseModel):
    id: str
    name: str
    lat: Optional[float]
    lng: Optional[float]
    radius: float
    department: Optional[str]
    status: str
    interventionLocations: List[dict]


class BookingLocationResponse(BaseModel):
    id: str
    lat: Optional[float]
    lng: Optional[float]
    status: str
    createdAt: str


class DepartmentCoverage(BaseModel):
    code: str
    name: str
    plumberCount: int
    bookingCount: int
    coverageScore: int
    center: dict


class CoverageStatsResponse(BaseModel):
    departments: List[DepartmentCoverage]


class InterventionLocationCreate(BaseModel):
    lat: float
    lng: float
    address: str
    label: str


class StatusUpdate(BaseModel):
    status: str


class DepartmentUpdate(BaseModel):
    department: str


# ============== Dashboard ==============

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_admin_user),
):
    """Get dashboard statistics."""
    from datetime import date, datetime

    # Count plumbers
    total_plumbers = (await session.execute(
        select(func.count(PlumberProfile.id))
    )).scalar_one()
    active_plumbers = (await session.execute(
        select(func.count(PlumberProfile.id)).where(
            PlumberProfile.status == PlumberStatus.ACTIVE
        )
    )).scalar_one()

    # Count customers
    total_customers = (await session.execute(
        select(func.count(CustomerProfile.id))
    )).scalar_one()

    # Count bookings
    total_bookings = (await session.execute(
        select(func.count(Booking.id))
    )).scalar_one()
    pending_bookings = (await session.execute(
        select(func.count(Booking.id)).where(
            Booking.status == BookingStatus.SUBMITTED
        )
    )).scalar_one()

    # Count orders
    total_orders = (await session.execute(
        select(func.count(Order.id))
    )).scalar_one()

    # Calculate total revenue (sum of completed orders)
    total_revenue = (await session.execute(
        select(func.sum(Order.total_amount)).where(
            Order.status == OrderStatus.COMPLETED
        )
    )).scalar_one() or 0

    # Today's jobs
    today = date.today()
    today_jobs = (await session.execute(
        select(func.count(Job.id)).where(
            func.date(Job.scheduled_date) == today
        )
    )).scalar_one()

    # Completed jobs
    completed_jobs = (await session.execute(
        select(func.count(Job.id)).where(
            Job.status == JobStatus.COMPLETED
        )
    )).scalar_one()

    # Stats by department
    department_stats = []
    for dept in Department:
        plumber_count = (await session.execute(
            select(func.count(PlumberProfile.id)).where(
                PlumberProfile.department == dept
            )
        )).scalar_one()

        # Get bookings in this department (by postal code prefix)
        booking_count = (await session.execute(
            select(func.count(Booking.id)).where(
                Booking.address_postal_code.startswith(dept.value)
            )
        )).scalar_one()

        # Get revenue from completed orders in this department (join via booking)
        dept_revenue = (await session.execute(
            select(func.sum(Order.total_amount))
            .join(Booking, Order.booking_id == Booking.id)
            .where(
                Order.status == OrderStatus.COMPLETED,
                Booking.address_postal_code.startswith(dept.value),
            )
        )).scalar_one() or 0

        department_stats.append(DepartmentStats(
            department=dept.value,
            plumbers=plumber_count,
            bookings=booking_count,
            revenue=int(dept_revenue),
        ))

    return DashboardStats(
        totalPlumbers=total_plumbers,
        activePlumbers=active_plumbers,
        totalCustomers=total_customers,
        totalBookings=total_bookings,
        pendingBookings=pending_bookings,
        totalOrders=total_orders,
        totalRevenue=total_revenue,
        todayJobs=today_jobs,
        completedJobs=completed_jobs,
        byDepartment=department_stats,
    )


# ============== Plumbers ==============

@router.get("/plumbers")
async def list_plumbers(
    department: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_admin_user),
):
    """List all plumbers with filters."""
    query = select(PlumberProfile)

    if department:
        query = query.where(PlumberProfile.department == department)
    if status:
        query = query.where(PlumberProfile.status == status)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = (await session.execute(count_query)).scalar_one()

    # Paginate
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    plumbers = (await session.execute(query)).scalars().all()

    # Load users
    items = []
    for plumber in plumbers:
        user = await session.get(User, plumber.user_id)
        items.append({
            "id": str(plumber.id),
            "userId": str(plumber.user_id),
            "user": {
                "id": str(user.id),
                "email": user.email,
                "firstName": user.first_name,
                "lastName": user.last_name,
                "phone": user.phone,
                "createdAt": user.created_at.isoformat(),
            } if user else None,
            "status": plumber.status.value,
            "department": plumber.department,
            "companyName": plumber.company_name,
            "siren": plumber.siren,
            "siret": plumber.siret,
            "serviceAreaLat": plumber.service_area_lat,
            "serviceAreaLng": plumber.service_area_lng,
            "serviceAreaRadiusKm": plumber.service_area_radius_km,
            "interventionLocations": plumber.intervention_locations or [],
            "totalJobsCompleted": plumber.total_jobs_completed,
            "averageRating": plumber.average_rating,
            "totalRatings": plumber.total_ratings,
            "stripeChargesEnabled": plumber.stripe_charges_enabled,
            "mandateSigned": plumber.mandate_signed,
            "createdAt": plumber.created_at.isoformat(),
        })

    return {"items": items, "total": total}


@router.get("/plumbers/{plumber_id}")
async def get_plumber(
    plumber_id: UUID,
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_admin_user),
):
    """Get a plumber by ID."""
    plumber = await session.get(PlumberProfile, plumber_id)
    if not plumber:
        raise HTTPException(status_code=404, detail="Plumber not found")

    user = await session.get(User, plumber.user_id)

    return {
        "id": str(plumber.id),
        "userId": str(plumber.user_id),
        "user": {
            "id": str(user.id),
            "email": user.email,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "phone": user.phone,
            "createdAt": user.created_at.isoformat(),
        } if user else None,
        "status": plumber.status.value,
        "department": plumber.department,
        "companyName": plumber.company_name,
        "siren": plumber.siren,
        "siret": plumber.siret,
        "serviceAreaLat": plumber.service_area_lat,
        "serviceAreaLng": plumber.service_area_lng,
        "serviceAreaRadiusKm": plumber.service_area_radius_km,
        "interventionLocations": plumber.intervention_locations or [],
        "totalJobsCompleted": plumber.total_jobs_completed,
        "averageRating": plumber.average_rating,
        "totalRatings": plumber.total_ratings,
        "stripeChargesEnabled": plumber.stripe_charges_enabled,
        "mandateSigned": plumber.mandate_signed,
        "createdAt": plumber.created_at.isoformat(),
    }


@router.patch("/plumbers/{plumber_id}/status")
async def update_plumber_status(
    plumber_id: UUID,
    data: StatusUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
):
    """Update plumber status."""
    plumber = await session.get(PlumberProfile, plumber_id)
    if not plumber:
        raise HTTPException(status_code=404, detail="Plumber not found")

    old_status = plumber.status
    plumber.status = PlumberStatus(data.status)
    session.add(plumber)

    # Log audit
    audit_log = AuditLog(
        user_id=current_user.id,
        entity_type="plumber",
        entity_id=plumber_id,
        action="status_change",
        changes={"old_status": old_status.value, "new_status": data.status},
    )
    session.add(audit_log)
    await session.commit()

    return {"success": True}


@router.patch("/plumbers/{plumber_id}/department")
async def update_plumber_department(
    plumber_id: UUID,
    data: DepartmentUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
):
    """Update plumber department."""
    plumber = await session.get(PlumberProfile, plumber_id)
    if not plumber:
        raise HTTPException(status_code=404, detail="Plumber not found")

    old_department = plumber.department
    plumber.department = Department(data.department) if data.department else None
    session.add(plumber)

    # Log audit
    audit_log = AuditLog(
        user_id=current_user.id,
        entity_type="plumber",
        entity_id=plumber_id,
        action="update",
        changes={
            "old_department": old_department,
            "new_department": data.department,
        },
    )
    session.add(audit_log)
    await session.commit()

    return {"success": True}


@router.post("/plumbers/{plumber_id}/intervention-locations")
async def add_intervention_location(
    plumber_id: UUID,
    location: InterventionLocationCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
):
    """Add an intervention location to a plumber."""
    plumber = await session.get(PlumberProfile, plumber_id)
    if not plumber:
        raise HTTPException(status_code=404, detail="Plumber not found")

    locations = plumber.intervention_locations or []
    locations.append(location.model_dump())
    plumber.intervention_locations = locations
    session.add(plumber)

    # Log audit
    audit_log = AuditLog(
        user_id=current_user.id,
        entity_type="plumber",
        entity_id=plumber_id,
        action="update",
        changes={"added_intervention_location": location.model_dump()},
    )
    session.add(audit_log)
    await session.commit()

    return {"success": True}


@router.delete("/plumbers/{plumber_id}/intervention-locations/{index}")
async def remove_intervention_location(
    plumber_id: UUID,
    index: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
):
    """Remove an intervention location from a plumber."""
    plumber = await session.get(PlumberProfile, plumber_id)
    if not plumber:
        raise HTTPException(status_code=404, detail="Plumber not found")

    locations = plumber.intervention_locations or []
    if index < 0 or index >= len(locations):
        raise HTTPException(status_code=400, detail="Invalid location index")

    removed = locations.pop(index)
    plumber.intervention_locations = locations
    session.add(plumber)

    # Log audit
    audit_log = AuditLog(
        user_id=current_user.id,
        entity_type="plumber",
        entity_id=plumber_id,
        action="update",
        changes={"removed_intervention_location": removed},
    )
    session.add(audit_log)
    await session.commit()

    return {"success": True}


# ============== Coverage ==============

@router.get("/coverage/plumbers", response_model=List[PlumberLocationResponse])
async def get_plumber_locations(
    department: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_admin_user),
):
    """Get plumber locations for the coverage map."""
    query = select(PlumberProfile).where(
        PlumberProfile.service_area_lat.is_not(None),
        PlumberProfile.service_area_lng.is_not(None),
    )

    if department:
        query = query.where(PlumberProfile.department == department)

    plumbers = (await session.execute(query)).scalars().all()

    result = []
    for plumber in plumbers:
        user = await session.get(User, plumber.user_id)
        result.append(PlumberLocationResponse(
            id=str(plumber.id),
            name=f"{user.first_name} {user.last_name}" if user else "Unknown",
            lat=plumber.service_area_lat,
            lng=plumber.service_area_lng,
            radius=plumber.service_area_radius_km,
            department=plumber.department,
            status=plumber.status.value,
            interventionLocations=plumber.intervention_locations or [],
        ))

    return result


@router.get("/coverage/bookings", response_model=List[BookingLocationResponse])
async def get_booking_locations(
    department: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_admin_user),
):
    """Get booking locations for the coverage map."""
    query = select(Booking).where(
        Booking.address_lat.is_not(None),
        Booking.address_lng.is_not(None),
    )

    if department:
        query = query.where(Booking.address_postal_code.startswith(department))

    bookings = (await session.execute(query)).scalars().all()

    return [
        BookingLocationResponse(
            id=str(booking.id),
            lat=booking.lat,
            lng=booking.lng,
            status=booking.status.value if hasattr(booking.status, 'value') else str(booking.status),
            createdAt=booking.created_at.isoformat(),
        )
        for booking in bookings
    ]


@router.get("/coverage/stats", response_model=CoverageStatsResponse)
async def get_coverage_stats(
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_admin_user),
):
    """Get coverage statistics by department."""
    department_info = {
        # DOM-TOM
        "971": {"name": "Guadeloupe", "center": {"lat": 16.265, "lng": -61.551}},
        "972": {"name": "Martinique", "center": {"lat": 14.641, "lng": -61.024}},
        "973": {"name": "Guyane", "center": {"lat": 4.938, "lng": -52.326}},
        "974": {"name": "Réunion", "center": {"lat": -21.115, "lng": 55.536}},
    }

    departments = []
    for code, info in department_info.items():
        plumber_count = (await session.execute(
            select(func.count(PlumberProfile.id)).where(
                PlumberProfile.department == code,
                PlumberProfile.status == PlumberStatus.ACTIVE,
            )
        )).scalar_one()

        booking_count = (await session.execute(
            select(func.count(Booking.id)).where(
                Booking.address_postal_code.startswith(code)
            )
        )).scalar_one()

        # Calculate coverage score (simplified)
        coverage_score = min(100, plumber_count * 20) if plumber_count > 0 else 0

        departments.append(DepartmentCoverage(
            code=code,
            name=info["name"],
            plumberCount=plumber_count,
            bookingCount=booking_count,
            coverageScore=coverage_score,
            center=info["center"],
        ))

    return CoverageStatsResponse(departments=departments)


# ============== Matching ==============


class SimulatePointRequest(BaseModel):
    lat: float
    lng: float
    department: Optional[str] = None
    weights: Optional[dict[str, float]] = None


class PlumberScoreItem(BaseModel):
    plumber_id: str
    name: str
    distance_km: float
    total_score: float
    proximity_score: float
    quality_score: float
    load_score: float
    total_jobs_completed: int
    average_rating: Optional[float]
    total_ratings: int
    lat: float
    lng: float
    radius_km: float
    rank: int


class SimulatePointResponse(BaseModel):
    point: dict
    weights: dict
    results: List[PlumberScoreItem]
    total_candidates: int


class GeocodeAddressRequest(BaseModel):
    address: str
    department: Optional[str] = None


class GeocodeAddressResponse(BaseModel):
    lat: float
    lng: float
    label: str
    score: float


@router.post("/matching/geocode", response_model=GeocodeAddressResponse)
async def geocode_address(
    data: GeocodeAddressRequest,
    _current_user: User = Depends(get_current_admin_user),
):
    """Geocode a single address using the French BAN API.

    When a department is provided, first tries a municipality search scoped to
    that department (handles DOM-TOM town names correctly), then falls back to
    a generic search with the department as a postcode hint.
    """
    import httpx

    async with httpx.AsyncClient(timeout=10.0) as client:
        feature = None

        # Strategy 1: municipality search scoped to department
        if data.department:
            try:
                resp = await client.get(
                    "https://api-adresse.data.gouv.fr/search/",
                    params={
                        "q": data.address,
                        "type": "municipality",
                        "citycode": None,  # not used, but postcode filters well
                        "postcode": data.department,  # e.g. "971" matches 971xx
                        "limit": 1,
                    },
                )
                resp.raise_for_status()
                features = resp.json().get("features", [])
                if features:
                    feature = features[0]
            except httpx.HTTPError:
                pass

        # Strategy 2: general search with department hint appended
        if not feature and data.department:
            try:
                resp = await client.get(
                    "https://api-adresse.data.gouv.fr/search/",
                    params={
                        "q": f"{data.address} {data.department}",
                        "limit": 5,
                    },
                )
                resp.raise_for_status()
                features = resp.json().get("features", [])
                # Pick the first result whose postcode starts with the department
                for f in features:
                    pc = f["properties"].get("postcode", "")
                    if pc.startswith(data.department):
                        feature = f
                        break
                if not feature and features:
                    feature = features[0]
            except httpx.HTTPError:
                pass

        # Strategy 3: plain search (no department context)
        if not feature:
            try:
                resp = await client.get(
                    "https://api-adresse.data.gouv.fr/search/",
                    params={"q": data.address, "limit": 1},
                )
                resp.raise_for_status()
                features = resp.json().get("features", [])
                if features:
                    feature = features[0]
            except httpx.HTTPError:
                raise HTTPException(status_code=502, detail="Erreur de géocodage (BAN API)")

    if not feature:
        raise HTTPException(status_code=404, detail="Adresse introuvable")

    coords = feature["geometry"]["coordinates"]  # [lng, lat]
    props = feature["properties"]

    return GeocodeAddressResponse(
        lat=coords[1],
        lng=coords[0],
        label=props.get("label", data.address),
        score=props.get("score", 0),
    )


@router.post("/matching/simulate-point", response_model=SimulatePointResponse)
async def simulate_matching_at_point_endpoint(
    data: SimulatePointRequest,
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_admin_user),
):
    """Simulate plumber matching at a given point on the map."""
    from ..services.matching import simulate_matching_at_point, DEFAULT_WEIGHTS, _normalize_weights

    scored = await simulate_matching_at_point(
        session=session,
        lat=data.lat,
        lng=data.lng,
        department=data.department,
        weights=data.weights,
    )

    # Resolve user names and build response items
    results = []
    for rank, item in enumerate(scored, start=1):
        plumber = item["plumber"]
        user = await session.get(User, plumber.user_id)
        name = f"{user.first_name} {user.last_name}" if user else "Inconnu"
        results.append(PlumberScoreItem(
            plumber_id=str(plumber.id),
            name=name,
            distance_km=item["distance_km"],
            total_score=item["total_score"],
            proximity_score=item["proximity_score"],
            quality_score=item["quality_score"],
            load_score=item["load_score"],
            total_jobs_completed=plumber.total_jobs_completed,
            average_rating=plumber.average_rating,
            total_ratings=plumber.total_ratings,
            lat=plumber.service_area_lat,
            lng=plumber.service_area_lng,
            radius_km=plumber.service_area_radius_km,
            rank=rank,
        ))

    # Normalize weights for the response
    used_weights = _normalize_weights(data.weights)
    display_weights = {k: round(v * 100, 1) for k, v in used_weights.items()}

    return SimulatePointResponse(
        point={"lat": data.lat, "lng": data.lng},
        weights=display_weights,
        results=results,
        total_candidates=len(results),
    )


@router.get("/matching/unmatched")
async def get_unmatched_bookings(
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_admin_user),
):
    """Get bookings that haven't been matched yet."""
    bookings = (await session.execute(
        select(Booking).where(
            Booking.status.in_([BookingStatus.DRAFT, BookingStatus.SUBMITTED])
        ).order_by(Booking.created_at.desc()).limit(20)
    )).scalars().all()

    return [
        {
            "id": str(booking.id),
            "customerId": str(booking.customer_id),
            "status": booking.status.value if hasattr(booking.status, 'value') else str(booking.status),
            "addressStreet": booking.address_street,
            "addressCity": booking.address_city,
            "addressPostalCode": booking.address_postal_code,
            "lat": booking.lat,
            "lng": booking.lng,
            "toiletType": booking.toilet_type.value if hasattr(booking.toilet_type, 'value') else str(booking.toilet_type),
            "hasShutoffValve": booking.has_shutoff_valve,
            "preferredDate": booking.preferred_date.isoformat() if booking.preferred_date else None,
            "preferredTimeSlot": booking.preferred_time_slot,
            "photoUrls": booking.photo_urls or [],
            "createdAt": booking.created_at.isoformat(),
        }
        for booking in bookings
    ]


@router.get("/matching/simulate/{booking_id}")
async def simulate_matching(
    booking_id: UUID,
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_admin_user),
):
    """Simulate matching for a booking."""
    from ..services.matching import find_matching_plumbers

    booking = await session.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Get matching plumbers
    if booking.lat and booking.lng:
        matched = await find_matching_plumbers(
            session=session,
            lat=booking.lat,
            lng=booking.lng,
            max_results=10,
        )
    else:
        matched = []

    # Format booking
    booking_data = {
        "id": str(booking.id),
        "customerId": str(booking.customer_id),
        "status": booking.status.value if hasattr(booking.status, 'value') else str(booking.status),
        "addressStreet": booking.address_street,
        "addressCity": booking.address_city,
        "addressPostalCode": booking.address_postal_code,
        "lat": booking.lat,
        "lng": booking.lng,
        "toiletType": booking.toilet_type.value if hasattr(booking.toilet_type, 'value') else str(booking.toilet_type),
        "hasShutoffValve": booking.has_shutoff_valve,
        "preferredDate": booking.preferred_date.isoformat() if booking.preferred_date else None,
        "preferredTimeSlot": booking.preferred_time_slot,
        "photoUrls": booking.photo_urls or [],
        "createdAt": booking.created_at.isoformat(),
    }

    # Format matched plumbers
    matched_plumbers = []
    for plumber, distance in matched:
        user = await session.get(User, plumber.user_id)
        # Calculate score based on distance and rating
        score = max(0, 100 - int(distance * 2))
        if plumber.average_rating:
            score += int(plumber.average_rating * 5)

        matched_plumbers.append({
            "plumber": {
                "id": str(plumber.id),
                "userId": str(plumber.user_id),
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "firstName": user.first_name,
                    "lastName": user.last_name,
                    "phone": user.phone,
                    "createdAt": user.created_at.isoformat(),
                } if user else None,
                "status": plumber.status.value,
                "department": plumber.department,
                "companyName": plumber.company_name,
                "serviceAreaLat": plumber.service_area_lat,
                "serviceAreaLng": plumber.service_area_lng,
                "serviceAreaRadiusKm": plumber.service_area_radius_km,
                "interventionLocations": plumber.intervention_locations or [],
                "totalJobsCompleted": plumber.total_jobs_completed,
                "averageRating": plumber.average_rating,
                "totalRatings": plumber.total_ratings,
                "stripeChargesEnabled": plumber.stripe_charges_enabled,
                "mandateSigned": plumber.mandate_signed,
                "createdAt": plumber.created_at.isoformat(),
            },
            "distance": distance,
            "score": score,
        })

    return {
        "booking": booking_data,
        "matchedPlumbers": sorted(matched_plumbers, key=lambda x: -x["score"]),
    }


# ============== Other Admin Lists ==============

@router.get("/customers")
async def list_customers(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_admin_user),
):
    """List all customers."""
    query = select(CustomerProfile)

    count_query = select(func.count()).select_from(query.subquery())
    total = (await session.execute(count_query)).scalar_one()

    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    customers = (await session.execute(query)).scalars().all()

    items = []
    for customer in customers:
        user = await session.get(User, customer.user_id)
        # Count orders
        order_count = (await session.execute(
            select(func.count(Order.id)).where(Order.customer_id == customer.id)
        )).scalar_one()

        items.append({
            "id": str(customer.id),
            "userId": str(customer.user_id),
            "user": {
                "id": str(user.id),
                "email": user.email,
                "firstName": user.first_name,
                "lastName": user.last_name,
                "phone": user.phone,
                "createdAt": user.created_at.isoformat(),
            } if user else None,
            "defaultAddress": customer.default_address,
            "defaultCity": customer.default_city,
            "defaultPostalCode": customer.default_postal_code,
            "totalOrders": order_count,
            "createdAt": customer.created_at.isoformat(),
        })

    return {"items": items, "total": total}


@router.get("/bookings")
async def list_bookings(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_admin_user),
):
    """List all bookings."""
    query = select(Booking)

    if status:
        query = query.where(Booking.status == status)

    query = query.order_by(Booking.created_at.desc())

    count_query = select(func.count()).select_from(query.subquery())
    total = (await session.execute(count_query)).scalar_one()

    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    bookings = (await session.execute(query)).scalars().all()

    return {
        "items": [
            {
                "id": str(booking.id),
                "customerId": str(booking.customer_id),
                "status": booking.status.value if hasattr(booking.status, 'value') else str(booking.status),
                "addressStreet": booking.address_street,
                "addressCity": booking.address_city,
                "addressPostalCode": booking.address_postal_code,
                "lat": booking.lat,
                "lng": booking.lng,
                "toiletType": booking.toilet_type.value if hasattr(booking.toilet_type, 'value') else str(booking.toilet_type),
                "hasShutoffValve": booking.has_shutoff_valve,
                "preferredDate": booking.preferred_date.isoformat() if booking.preferred_date else None,
                "preferredTimeSlot": booking.preferred_time_slot,
                "photoUrls": booking.photo_urls or [],
                "createdAt": booking.created_at.isoformat(),
            }
            for booking in bookings
        ],
        "total": total,
    }


@router.get("/orders")
async def list_orders(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_admin_user),
):
    """List all orders."""
    query = select(Order)

    if status:
        query = query.where(Order.status == status)

    query = query.order_by(Order.created_at.desc())

    count_query = select(func.count()).select_from(query.subquery())
    total = (await session.execute(count_query)).scalar_one()

    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    orders = (await session.execute(query)).scalars().all()

    return {
        "items": [
            {
                "id": str(order.id),
                "bookingId": str(order.booking_id) if order.booking_id else None,
                "customerId": str(order.customer_id),
                "plumberId": str(order.plumber_id) if order.plumber_id else None,
                "status": order.status.value if hasattr(order.status, 'value') else str(order.status),
                "totalAmount": order.total_amount,
                "productAmount": order.product_amount,
                "installationAmount": order.installation_amount,
                "platformFee": order.platform_fee,
                "scheduledDate": order.scheduled_date.isoformat() if order.scheduled_date else None,
                "createdAt": order.created_at.isoformat(),
            }
            for order in orders
        ],
        "total": total,
    }


@router.get("/jobs")
async def list_jobs(
    status: Optional[str] = None,
    plumber_id: Optional[UUID] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_admin_user),
):
    """List all jobs."""
    query = select(Job)

    if status:
        query = query.where(Job.status == status)
    if plumber_id:
        query = query.where(Job.plumber_id == plumber_id)

    query = query.order_by(Job.scheduled_date.desc())

    count_query = select(func.count()).select_from(query.subquery())
    total = (await session.execute(count_query)).scalar_one()

    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    jobs = (await session.execute(query)).scalars().all()

    items = []
    for job in jobs:
        plumber = await session.get(PlumberProfile, job.plumber_id) if job.plumber_id else None
        plumber_user = await session.get(User, plumber.user_id) if plumber else None

        items.append({
            "id": str(job.id),
            "orderId": str(job.order_id),
            "plumberId": str(job.plumber_id),
            "plumber": {
                "id": str(plumber.id),
                "userId": str(plumber.user_id),
                "user": {
                    "id": str(plumber_user.id),
                    "email": plumber_user.email,
                    "firstName": plumber_user.first_name,
                    "lastName": plumber_user.last_name,
                    "phone": plumber_user.phone,
                    "createdAt": plumber_user.created_at.isoformat(),
                } if plumber_user else None,
                "status": plumber.status.value,
            } if plumber else None,
            "status": job.status.value if hasattr(job.status, 'value') else str(job.status),
            "scheduledDate": job.scheduled_date.isoformat(),
            "checkinLat": job.checkin_lat,
            "checkinLng": job.checkin_lng,
            "checkinTime": job.checkin_time.isoformat() if job.checkin_time else None,
            "startTime": job.start_time.isoformat() if job.start_time else None,
            "completedAt": job.completed_at.isoformat() if job.completed_at else None,
            "photoBeforeUrls": job.photo_before_urls or [],
            "photoAfterUrls": job.photo_after_urls or [],
            "signatureName": job.signature_name,
            "createdAt": job.created_at.isoformat(),
        })

    return {"items": items, "total": total}


@router.get("/invoices")
async def list_invoices(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_admin_user),
):
    """List all invoices."""
    query = select(Invoice).order_by(Invoice.invoice_date.desc())

    count_query = select(func.count()).select_from(query.subquery())
    total = (await session.execute(count_query)).scalar_one()

    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    invoices = (await session.execute(query)).scalars().all()

    return {
        "items": [
            {
                "id": str(invoice.id),
                "invoiceNumber": invoice.invoice_number,
                "orderId": str(invoice.order_id),
                "customerId": str(invoice.customer_id),
                "plumberId": str(invoice.plumber_id),
                "totalAmount": invoice.total_amount,
                "productAmount": invoice.product_amount,
                "installationAmount": invoice.installation_amount,
                "vatAmount": invoice.vat_amount,
                "status": invoice.status.value if hasattr(invoice.status, 'value') else str(invoice.status),
                "issuedAt": invoice.issued_at.isoformat(),
                "paidAt": invoice.paid_at.isoformat() if invoice.paid_at else None,
            }
            for invoice in invoices
        ],
        "total": total,
    }


@router.get("/products")
async def list_products(
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_admin_user),
):
    """List all products with pricing breakdown."""
    products = (await session.execute(select(Product))).scalars().all()

    # Get pricing config
    config_result = await session.execute(
        select(PricingConfig).where(PricingConfig.name == "default")
    )
    config = config_result.scalar_one_or_none()

    result = []
    for product in products:
        # Calculate price breakdown
        price_first = PricingConfig.calculate_price(
            product.supplier_price,
            is_first_unit=True,
            config=config
        )
        price_additional = PricingConfig.calculate_price(
            product.supplier_price,
            is_first_unit=False,
            config=config
        )

        result.append({
            "id": str(product.id),
            "sku": product.sku,
            "name": product.name,
            "slug": product.slug,
            "description": product.description,
            # Costs
            "supplierPrice": product.supplier_price,
            "priceB2C": product.price_b2c,
            "priceB2B": product.price_b2b,
            "installationPrice": product.installation_price,
            # Calculated prices
            "calculatedPriceFirst": price_first["total"],
            "calculatedPriceAdditional": price_additional["total"],
            "priceBreakdownFirst": price_first,
            "priceBreakdownAdditional": price_additional,
            # Other fields
            "imageUrl": product.image_url,
            "isActive": product.is_active,
            "stockQuantity": product.stock_quantity,
            "createdAt": product.created_at.isoformat(),
        })

    return result


@router.get("/audit")
async def list_audit_logs(
    entity_type: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_admin_user),
):
    """List audit logs."""
    query = select(AuditLog)

    if entity_type:
        query = query.where(AuditLog.entity_type == entity_type)

    query = query.order_by(AuditLog.created_at.desc())

    count_query = select(func.count()).select_from(query.subquery())
    total = (await session.execute(count_query)).scalar_one()

    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    logs = (await session.execute(query)).scalars().all()

    return {
        "items": [
            {
                "id": str(log.id),
                "userId": str(log.user_id) if log.user_id else None,
                "entityType": log.entity_type,
                "entityId": str(log.entity_id),
                "action": log.action,
                "changes": log.changes,
                "ipAddress": log.ip_address,
                "createdAt": log.created_at.isoformat(),
            }
            for log in logs
        ],
        "total": total,
    }


# ============== Pricing Config ==============

class PricingConfigUpdate(BaseModel):
    plumber_travel_fee: Optional[int] = None
    plumber_labor_fee: Optional[int] = None
    commission_first_unit: Optional[int] = None
    commission_additional: Optional[int] = None
    b2b_discount_percent: Optional[int] = None
    notes: Optional[str] = None


class ProductUpdate(BaseModel):
    supplier_price: Optional[int] = None
    price_b2c: Optional[int] = None
    price_b2b: Optional[int] = None
    name: Optional[str] = None
    description: Optional[str] = None
    stock_quantity: Optional[int] = None
    is_available: Optional[bool] = None


@router.get("/pricing")
async def get_pricing_config(
    session: AsyncSession = Depends(get_session),
    _current_user: User = Depends(get_current_admin_user),
):
    """Get pricing configuration."""
    config_result = await session.execute(
        select(PricingConfig).where(PricingConfig.name == "default")
    )
    config = config_result.scalar_one_or_none()

    if not config:
        # Create default config
        config = PricingConfig(name="default")
        session.add(config)
        await session.commit()
        await session.refresh(config)

    return {
        "id": str(config.id),
        "name": config.name,
        "plumberTravelFee": config.plumber_travel_fee,
        "plumberLaborFee": config.plumber_labor_fee,
        "commissionFirstUnit": config.commission_first_unit,
        "commissionAdditional": config.commission_additional,
        "b2bDiscountPercent": config.b2b_discount_percent,
        "notes": config.notes,
        # Calculated examples (with 4500 cents = 45€ supplier price)
        "exampleFirstUnit": PricingConfig.calculate_price(4500, True, config=config),
        "exampleAdditional": PricingConfig.calculate_price(4500, False, config=config),
    }


@router.patch("/pricing")
async def update_pricing_config(
    data: PricingConfigUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
):
    """Update pricing configuration."""
    config_result = await session.execute(
        select(PricingConfig).where(PricingConfig.name == "default")
    )
    config = config_result.scalar_one_or_none()

    if not config:
        config = PricingConfig(name="default")
        session.add(config)

    # Track changes
    changes = {}
    for field, value in data.model_dump(exclude_none=True).items():
        old_value = getattr(config, field)
        if old_value != value:
            changes[field] = {"old": old_value, "new": value}
            setattr(config, field, value)

    if changes:
        # Log audit
        audit_log = AuditLog(
            user_id=current_user.id,
            entity_type="pricing_config",
            entity_id=config.id,
            action="update",
            changes=changes,
        )
        session.add(audit_log)

    await session.commit()
    await session.refresh(config)

    return {"success": True, "changes": changes}


@router.patch("/products/{product_id}")
async def update_product(
    product_id: UUID,
    data: ProductUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
):
    """Update a product's pricing and details."""
    product = await session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Track changes
    changes = {}
    for field, value in data.model_dump(exclude_none=True).items():
        old_value = getattr(product, field)
        if old_value != value:
            changes[field] = {"old": old_value, "new": value}
            setattr(product, field, value)

    if changes:
        # Log audit
        audit_log = AuditLog(
            user_id=current_user.id,
            entity_type="product",
            entity_id=product.id,
            action="update",
            changes=changes,
        )
        session.add(audit_log)

    await session.commit()
    await session.refresh(product)

    return {"success": True, "changes": changes}
