"""Geocoding service using the BAN (Base Adresse Nationale) API."""

import csv
import logging
from datetime import datetime
from io import StringIO
from typing import List

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.prospect import PlumberProspect

logger = logging.getLogger(__name__)

BATCH_SIZE = 100
BAN_BASE_URL = "https://api-adresse.data.gouv.fr"
# Minimum score threshold to accept a geocoding result (0-1)
MIN_SCORE = 0.3


class GeocodingService:
    """Batch geocoding via the French BAN API."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def geocode_prospects(self, prospects: List[PlumberProspect]) -> dict:
        """Geocode a list of prospects using BAN batch CSV endpoint.

        Returns dict with keys: geocoded, failed, skipped.
        """
        stats = {"geocoded": 0, "failed": 0, "skipped": 0}

        # Split into geocodable vs not
        to_geocode: list[PlumberProspect] = []
        for p in prospects:
            if p.adresse and p.adresse.strip():
                to_geocode.append(p)
            elif p.ville and p.ville.strip():
                to_geocode.append(p)
            else:
                stats["skipped"] += 1

        # Process in batches
        for i in range(0, len(to_geocode), BATCH_SIZE):
            batch = to_geocode[i : i + BATCH_SIZE]
            batch_stats = await self._geocode_batch(batch)
            stats["geocoded"] += batch_stats["geocoded"]
            stats["failed"] += batch_stats["failed"]

            # Retry failures with municipality fallback
            if batch_stats["failed_prospects"]:
                retry = [p for p in batch_stats["failed_prospects"] if p.ville]
                if retry:
                    retry_stats = await self._geocode_batch_municipality(retry)
                    stats["geocoded"] += retry_stats["geocoded"]
                    # Adjust: successes on retry reduce the fail count
                    stats["failed"] -= retry_stats["geocoded"]

        return stats

    async def _geocode_batch(self, batch: List[PlumberProspect]) -> dict:
        """Geocode a single batch via BAN CSV endpoint (full address search)."""
        stats: dict = {"geocoded": 0, "failed": 0, "failed_prospects": []}

        csv_buf = StringIO()
        writer = csv.writer(csv_buf)
        writer.writerow(["id", "adresse", "code_postal", "ville"])
        for p in batch:
            adresse = (p.adresse or "").strip()
            code_postal = (p.code_postal or "").strip()
            ville = (p.ville or "").strip()
            writer.writerow([str(p.id), adresse, code_postal, ville])

        csv_content = csv_buf.getvalue().encode("utf-8")

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{BAN_BASE_URL}/search/csv/",
                    files={"data": ("prospects.csv", csv_content, "text/csv")},
                    data={
                        "columns": ["adresse", "ville"],
                        "postcode": "code_postal",
                    },
                )
                response.raise_for_status()
        except httpx.HTTPError as e:
            logger.error(f"BAN API error: {e}")
            stats["failed"] = len(batch)
            stats["failed_prospects"] = list(batch)
            return stats

        result_text = response.text
        reader = csv.DictReader(StringIO(result_text))

        prospect_map = {str(p.id): p for p in batch}
        now = datetime.utcnow()

        for row in reader:
            prospect_id = row.get("id", "")
            prospect = prospect_map.get(prospect_id)
            if not prospect:
                continue

            lat = row.get("latitude", "") or row.get("result_latitude", "")
            lng = row.get("longitude", "") or row.get("result_longitude", "")
            score = row.get("result_score", "")

            try:
                score_val = float(score) if score else 0
            except ValueError:
                score_val = 0

            if lat and lng and score_val >= MIN_SCORE:
                prospect.latitude = float(lat)
                prospect.longitude = float(lng)
                prospect.geocoded_at = now
                self.session.add(prospect)
                stats["geocoded"] += 1
            else:
                stats["failed"] += 1
                stats["failed_prospects"].append(prospect)

        await self.session.commit()
        return stats

    async def _geocode_batch_municipality(self, batch: List[PlumberProspect]) -> dict:
        """Fallback: geocode by municipality only (city center)."""
        stats = {"geocoded": 0, "failed": 0}

        csv_buf = StringIO()
        writer = csv.writer(csv_buf)
        writer.writerow(["id", "ville", "code_postal"])
        for p in batch:
            code_postal = (p.code_postal or "").strip()
            ville = (p.ville or "").strip()
            writer.writerow([str(p.id), ville, code_postal])

        csv_content = csv_buf.getvalue().encode("utf-8")

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{BAN_BASE_URL}/search/csv/",
                    files={"data": ("prospects.csv", csv_content, "text/csv")},
                    data={
                        "columns": ["ville"],
                        "postcode": "code_postal",
                    },
                )
                response.raise_for_status()
        except httpx.HTTPError as e:
            logger.error(f"BAN municipality fallback error: {e}")
            stats["failed"] = len(batch)
            return stats

        result_text = response.text
        reader = csv.DictReader(StringIO(result_text))

        prospect_map = {str(p.id): p for p in batch}
        now = datetime.utcnow()

        for row in reader:
            prospect_id = row.get("id", "")
            prospect = prospect_map.get(prospect_id)
            if not prospect:
                continue

            lat = row.get("latitude", "") or row.get("result_latitude", "")
            lng = row.get("longitude", "") or row.get("result_longitude", "")

            if lat and lng:
                prospect.latitude = float(lat)
                prospect.longitude = float(lng)
                prospect.geocoded_at = now
                self.session.add(prospect)
                stats["geocoded"] += 1
            else:
                stats["failed"] += 1

        await self.session.commit()
        return stats
