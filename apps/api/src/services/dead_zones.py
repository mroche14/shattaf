"""Dead zone detection service.

Computes uncovered areas within a department by subtracting plumber
coverage buffers (or isochrones) from the department boundary.

Isochrone providers (in priority order):
1. HERE Isoline API (primary) — 250k free requests/month
2. ORS Isochrone API (fallback) — limited free tier
"""

import asyncio
import hashlib
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

import httpx
from pyproj import Transformer
from shapely.geometry import MultiPolygon, Point, Polygon, mapping, shape
from shapely.ops import unary_union
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..models.dead_zone_cache import DeadZoneCache

logger = logging.getLogger(__name__)

# Directory containing bundled GeoJSON department boundaries
BOUNDARIES_DIR = Path(__file__).parent.parent / "data" / "boundaries"

# CRS mapping: department code → metric EPSG code
DEPARTMENT_CRS = {
    "971": 5490,  # RGAF09 / UTM 20N (Guadeloupe)
    "972": 5490,  # RGAF09 / UTM 20N (Martinique)
    "973": 2972,  # RGFG95 / UTM 22N (Guyane)
}


class DepartmentBoundaryCache:
    """Lazy-loads and caches department boundary polygons from disk."""

    _cache: dict[str, Any] = {}

    @classmethod
    def get(cls, department: str) -> Any:
        """Return a Shapely geometry for the department boundary."""
        if department not in cls._cache:
            path = BOUNDARIES_DIR / f"{department}.geojson"
            if not path.exists():
                raise FileNotFoundError(
                    f"Contour du département {department} non disponible"
                )
            with open(path) as f:
                data = json.load(f)
            # Handle both Feature and raw geometry
            geom_data = data.get("geometry", data)
            cls._cache[department] = shape(geom_data)
        return cls._cache[department]

    @classmethod
    def get_geojson(cls, department: str) -> dict:
        """Return raw GeoJSON dict for the department boundary."""
        path = BOUNDARIES_DIR / f"{department}.geojson"
        if not path.exists():
            raise FileNotFoundError(
                f"Contour du département {department} non disponible"
            )
        with open(path) as f:
            return json.load(f)


class IsochroneCache:
    """In-memory cache for isochrone responses (provider-agnostic)."""

    _cache: dict[tuple, Any] = {}

    @classmethod
    def get(cls, lat: float, lng: float, range_seconds: int) -> Any | None:
        key = (round(lat, 5), round(lng, 5), range_seconds)
        return cls._cache.get(key)

    @classmethod
    def set(cls, lat: float, lng: float, range_seconds: int, geometry: Any) -> None:
        key = (round(lat, 5), round(lng, 5), range_seconds)
        cls._cache[key] = geometry


def compute_cache_key(
    department: str,
    mode: str,
    threshold: float,
    locations: list[tuple[float, float]],
) -> str:
    """Build a SHA-256 cache key from sorted, rounded coordinates + params."""
    rounded = sorted((round(lat, 5), round(lng, 5)) for lat, lng in locations)
    payload = json.dumps(
        {"d": department, "m": mode, "t": threshold, "pts": rounded},
        separators=(",", ":"),
    )
    return hashlib.sha256(payload.encode()).hexdigest()


async def get_cached_dead_zone(
    session: AsyncSession, cache_key: str
) -> DeadZoneCache | None:
    """Return a non-expired cache entry, or None."""
    result = await session.execute(
        select(DeadZoneCache).where(
            DeadZoneCache.cache_key == cache_key,
            DeadZoneCache.expires_at > datetime.utcnow(),
        )
    )
    return result.scalars().first()


async def save_dead_zone_cache(
    session: AsyncSession,
    *,
    cache_key: str,
    department: str,
    mode: str,
    threshold: float,
    source_type: str,
    point_count: int,
    plumber_count: int,
    geojson: Any,
    stats: Any,
    provider: str | None,
    compute_duration_ms: int,
) -> DeadZoneCache:
    """Upsert a dead zone cache entry (delete old + insert new)."""
    await session.execute(
        delete(DeadZoneCache).where(DeadZoneCache.cache_key == cache_key)
    )
    entry = DeadZoneCache(
        cache_key=cache_key,
        department=department,
        mode=mode,
        threshold=threshold,
        source_type=source_type,
        point_count=point_count,
        plumber_count=plumber_count,
        geojson=geojson,
        stats=stats,
        provider=provider,
        compute_duration_ms=compute_duration_ms,
        expires_at=datetime.utcnow() + timedelta(days=30),
    )
    session.add(entry)
    await session.commit()
    return entry


def _get_transformers(department: str) -> tuple[Transformer, Transformer]:
    """Return (to_metric, to_wgs84) transformers for the given department."""
    epsg = DEPARTMENT_CRS.get(department)
    if not epsg:
        raise ValueError(f"No CRS mapping for department {department}")
    to_metric = Transformer.from_crs(4326, epsg, always_xy=True)
    to_wgs84 = Transformer.from_crs(epsg, 4326, always_xy=True)
    return to_metric, to_wgs84


def _transform_geometry(geom: Any, transformer: Transformer) -> Any:
    """Transform a Shapely geometry using a pyproj Transformer."""
    from shapely.ops import transform as shapely_transform

    def _transform_coords(x, y):
        return transformer.transform(x, y)

    return shapely_transform(_transform_coords, geom)


def _compute_area_km2(geom: Any, department: str) -> float:
    """Compute area of a geometry in km² using the department's metric CRS."""
    to_metric, _ = _get_transformers(department)
    projected = _transform_geometry(geom, to_metric)
    return projected.area / 1_000_000  # m² → km²


def _to_geojson(geom: Any) -> dict | None:
    """Convert a Shapely geometry to GeoJSON dict, or None if empty."""
    if geom is None or geom.is_empty:
        return None
    return mapping(geom)


def compute_distance_dead_zones(
    department: str,
    plumber_locations: list[tuple[float, float, float]],
) -> dict:
    """Compute dead zones using distance-based buffers.

    Args:
        department: Department code ("971", "972", "973")
        plumber_locations: List of (lat, lng, threshold_km) tuples

    Returns:
        Dict with geojson, stats, and plumber_count
    """
    boundary = DepartmentBoundaryCache.get(department)
    to_metric, to_wgs84 = _get_transformers(department)

    # Project boundary to metric CRS
    boundary_m = _transform_geometry(boundary, to_metric)

    # Build coverage union from plumber buffers
    buffers = []
    for lat, lng, threshold_km in plumber_locations:
        # Transform point to metric CRS (note: always_xy means lng, lat order)
        x, y = to_metric.transform(lng, lat)
        point_m = Point(x, y)
        buffer_m = point_m.buffer(threshold_km * 1000)
        buffers.append(buffer_m)

    if buffers:
        coverage_m = unary_union(buffers)
        dead_zone_m = boundary_m.difference(coverage_m)
    else:
        dead_zone_m = boundary_m

    # Compute stats in metric space
    dept_area_km2 = boundary_m.area / 1_000_000
    dead_zone_area_km2 = dead_zone_m.area / 1_000_000
    coverage_percent = round(
        (1 - dead_zone_area_km2 / dept_area_km2) * 100, 1
    ) if dept_area_km2 > 0 else 0

    # Project dead zone back to WGS84 and simplify for transmission
    if not dead_zone_m.is_empty:
        dead_zone_wgs84 = _transform_geometry(dead_zone_m, to_wgs84)
        dead_zone_wgs84 = dead_zone_wgs84.simplify(0.001)
    else:
        dead_zone_wgs84 = dead_zone_m

    return {
        "geojson": _to_geojson(dead_zone_wgs84),
        "stats": {
            "department_area_km2": round(dept_area_km2, 1),
            "dead_zone_area_km2": round(dead_zone_area_km2, 1),
            "coverage_percent": coverage_percent,
        },
        "plumber_count": len(plumber_locations),
    }


async def _fetch_here_isochrone(
    client: httpx.AsyncClient,
    lat: float,
    lng: float,
    range_seconds: int,
    api_key: str,
) -> Any | None:
    """Fetch a single isochrone polygon from HERE Isoline API.

    HERE returns isolines as flexible polyline encoded shapes.
    We request GeoJSON polygons via `&type=json`.
    """
    # Check cache first
    cached = IsochroneCache.get(lat, lng, range_seconds)
    if cached is not None:
        return cached

    url = "https://isoline.router.hereapi.com/v8/isolines"
    params = {
        "apiKey": api_key,
        "origin": f"{lat},{lng}",
        "range[type]": "time",
        "range[values]": str(range_seconds),
        "transportMode": "car",
    }

    try:
        resp = await client.get(url, params=params, timeout=30)

        if resp.status_code == 429:
            raise httpx.HTTPStatusError(
                "Limite HERE atteinte", request=resp.request, response=resp
            )

        resp.raise_for_status()
        data = resp.json()

        isolines = data.get("isolines", [])
        if not isolines:
            return None

        # HERE returns isolines[].polygons[].outer as flexible polyline
        # Decode the flexible polyline to coordinates
        polygons = isolines[0].get("polygons", [])
        if not polygons:
            return None

        # Decode flexible polyline encoding
        outer = polygons[0].get("outer")
        if not outer:
            return None

        coords = _decode_here_polyline(outer)
        if len(coords) < 3:
            return None

        geom = Polygon(coords)
        if not geom.is_valid:
            geom = geom.buffer(0)

        IsochroneCache.set(lat, lng, range_seconds, geom)
        return geom

    except httpx.TimeoutException:
        logger.warning("HERE isochrone timeout for (%s, %s)", lat, lng)
        return None
    except httpx.HTTPStatusError:
        raise
    except Exception as e:
        logger.error("HERE isochrone error for (%s, %s): %s", lat, lng, e)
        return None


def _decode_here_polyline(encoded: str) -> list[tuple[float, float]]:
    """Decode HERE's flexible polyline to list of (lng, lat) coords for Shapely.

    Uses the official flexpolyline library. HERE returns (lat, lng) tuples;
    we swap to (lng, lat) for Shapely/GeoJSON compatibility.
    """
    import flexpolyline

    decoded = flexpolyline.decode(encoded)
    # decoded is a list of (lat, lng) or (lat, lng, alt) tuples
    return [(point[1], point[0]) for point in decoded]


async def _fetch_ors_isochrone(
    client: httpx.AsyncClient,
    lat: float,
    lng: float,
    range_seconds: int,
    api_key: str,
) -> Any | None:
    """Fetch a single isochrone polygon from ORS API (fallback)."""
    # Check cache first
    cached = IsochroneCache.get(lat, lng, range_seconds)
    if cached is not None:
        return cached

    url = "https://api.openrouteservice.org/v2/isochrones/driving-car"
    payload = {
        "locations": [[lng, lat]],  # ORS uses [lng, lat] order
        "range": [range_seconds],
        "range_type": "time",
    }
    headers = {
        "Authorization": api_key,
        "Content-Type": "application/json",
    }

    try:
        resp = await client.post(url, json=payload, headers=headers, timeout=30)

        if resp.status_code == 429:
            raise httpx.HTTPStatusError(
                "Limite ORS atteinte", request=resp.request, response=resp
            )

        resp.raise_for_status()
        data = resp.json()

        # ORS returns a FeatureCollection with one Feature per range value
        features = data.get("features", [])
        if not features:
            return None

        geom = shape(features[0]["geometry"])
        IsochroneCache.set(lat, lng, range_seconds, geom)
        return geom

    except httpx.TimeoutException:
        logger.warning("ORS isochrone timeout for (%s, %s)", lat, lng)
        return None
    except httpx.HTTPStatusError:
        raise
    except Exception as e:
        logger.error("ORS isochrone error for (%s, %s): %s", lat, lng, e)
        return None


async def compute_time_dead_zones(
    department: str,
    plumber_locations: list[tuple[float, float]],
    threshold_minutes: float,
) -> dict:
    """Compute dead zones using isochrone (driving time).

    Uses HERE Isoline API as primary provider, falls back to ORS.

    Args:
        department: Department code
        plumber_locations: List of (lat, lng) tuples
        threshold_minutes: Driving time threshold in minutes

    Returns:
        Dict with geojson, stats, plumber_count, and provider used
    """
    settings = get_settings()

    # Determine which provider to use
    use_here = bool(settings.HERE_API_KEY)
    use_ors = bool(settings.ORS_API_KEY)
    if not use_here and not use_ors:
        raise ValueError(
            "Aucune clé API isochrone configurée (HERE_API_KEY ou ORS_API_KEY)"
        )

    boundary = DepartmentBoundaryCache.get(department)
    range_seconds = int(threshold_minutes * 60)
    provider_used = "here" if use_here else "ors"

    # Deduplicate locations and fetch in parallel batches
    isochrone_polys: list[Any] = []
    seen: set[tuple[float, float]] = set()
    unique_locations: list[tuple[float, float]] = []

    for lat, lng in plumber_locations:
        key = (round(lat, 5), round(lng, 5))
        if key in seen:
            cached = IsochroneCache.get(lat, lng, range_seconds)
            if cached is not None:
                isochrone_polys.append(cached)
            continue
        seen.add(key)
        unique_locations.append((lat, lng))

    async with httpx.AsyncClient() as client:
        tasks = [
            _fetch_isochrone_with_fallback(
                client, lat, lng, range_seconds, settings, use_here, use_ors
            )
            for lat, lng in unique_locations
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for result in results:
            if isinstance(result, Exception):
                if isinstance(result, httpx.HTTPStatusError) and result.response.status_code == 429:
                    raise result
                logger.warning("Isochrone error: %s", result)
            elif result is not None:
                isochrone_polys.append(result)

    # Compute dead zone
    if isochrone_polys:
        coverage = unary_union(isochrone_polys)
        dead_zone = boundary.difference(coverage)
    else:
        dead_zone = boundary

    # Compute stats
    dept_area_km2 = _compute_area_km2(boundary, department)
    dead_zone_area_km2 = _compute_area_km2(dead_zone, department)
    coverage_percent = round(
        (1 - dead_zone_area_km2 / dept_area_km2) * 100, 1
    ) if dept_area_km2 > 0 else 0

    # Simplify for transmission
    if not dead_zone.is_empty:
        dead_zone = dead_zone.simplify(0.001)

    return {
        "geojson": _to_geojson(dead_zone),
        "stats": {
            "department_area_km2": round(dept_area_km2, 1),
            "dead_zone_area_km2": round(dead_zone_area_km2, 1),
            "coverage_percent": coverage_percent,
        },
        "plumber_count": len(plumber_locations),
        "provider": provider_used,
    }


async def _fetch_isochrone_with_fallback(
    client: httpx.AsyncClient,
    lat: float,
    lng: float,
    range_seconds: int,
    settings: Any,
    use_here: bool,
    use_ors: bool,
) -> Any | None:
    """Fetch isochrone with HERE as primary, ORS as fallback."""
    if use_here:
        try:
            geom = await _fetch_here_isochrone(
                client, lat, lng, range_seconds, settings.HERE_API_KEY
            )
            if geom is not None:
                return geom
            # HERE returned no data, try ORS fallback
            if use_ors:
                logger.info("HERE returned no data for (%s, %s), trying ORS", lat, lng)
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                if use_ors:
                    logger.warning("HERE rate limited, falling back to ORS")
                else:
                    raise
            else:
                if not use_ors:
                    logger.warning("HERE failed for (%s, %s): %s", lat, lng, e)
                    return None

    if use_ors:
        try:
            return await _fetch_ors_isochrone(
                client, lat, lng, range_seconds, settings.ORS_API_KEY
            )
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                raise
            logger.warning("ORS failed for (%s, %s): %s", lat, lng, e)

    return None
