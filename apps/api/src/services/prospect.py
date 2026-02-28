"""Prospect service for business logic."""

import csv
from datetime import datetime
from io import StringIO
from typing import Optional, List, Tuple
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_

from ..models.prospect import PlumberProspect, ContactStatus
from ..models.plumber import PlumberProfile
from ..schemas.prospect import (
    ProspectFilters,
    ProspectStats,
    ImportResult,
)
from ..utils.db import uuid_column_eq


class ProspectService:
    """Prospect management service."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_prospect(self, prospect_id: UUID) -> Optional[PlumberProspect]:
        """Get prospect by ID."""
        result = await self.session.execute(
            select(PlumberProspect).where(uuid_column_eq(PlumberProspect.id, prospect_id))
        )
        return result.scalar_one_or_none()

    async def list_prospects(
        self, filters: ProspectFilters
    ) -> Tuple[List[PlumberProspect], int]:
        """List prospects with filters and pagination."""
        query = select(PlumberProspect)

        # Apply filters
        if filters.departement:
            query = query.where(PlumberProspect.departement == filters.departement)

        if filters.contact_status:
            query = query.where(PlumberProspect.contact_status == filters.contact_status)

        if filters.individuel is not None:
            query = query.where(PlumberProspect.individuel == filters.individuel)

        if filters.has_telephone:
            query = query.where(
                PlumberProspect.telephone.isnot(None),
                PlumberProspect.telephone != ""
            )

        if filters.has_email:
            query = query.where(
                PlumberProspect.email.isnot(None),
                PlumberProspect.email != ""
            )

        if filters.search:
            search_term = f"%{filters.search}%"
            query = query.where(
                or_(
                    PlumberProspect.raison_sociale.ilike(search_term),
                    PlumberProspect.nom_dirigeant.ilike(search_term),
                    PlumberProspect.prenom_dirigeant.ilike(search_term),
                    PlumberProspect.telephone.ilike(search_term),
                    PlumberProspect.siren.ilike(search_term),
                    PlumberProspect.ville.ilike(search_term),
                )
            )

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total = total_result.scalar() or 0

        # Apply pagination
        offset = (filters.page - 1) * filters.limit
        query = query.order_by(PlumberProspect.created_at.desc())
        query = query.offset(offset).limit(filters.limit)

        result = await self.session.execute(query)
        items = list(result.scalars().all())

        return items, total

    async def get_stats(self) -> ProspectStats:
        """Get prospect statistics."""
        # Total count
        total_result = await self.session.execute(
            select(func.count(PlumberProspect.id))
        )
        total = total_result.scalar() or 0

        # With telephone
        tel_result = await self.session.execute(
            select(func.count(PlumberProspect.id)).where(
                PlumberProspect.telephone.isnot(None),
                PlumberProspect.telephone != ""
            )
        )
        with_telephone = tel_result.scalar() or 0

        # With email
        email_result = await self.session.execute(
            select(func.count(PlumberProspect.id)).where(
                PlumberProspect.email.isnot(None),
                PlumberProspect.email != ""
            )
        )
        with_email = email_result.scalar() or 0

        # By status
        status_query = select(
            PlumberProspect.contact_status,
            func.count(PlumberProspect.id)
        ).group_by(PlumberProspect.contact_status)
        status_result = await self.session.execute(status_query)
        by_status = {}
        for row in status_result.all():
            # Handle both enum and string values
            status_value = row[0].value if hasattr(row[0], 'value') else str(row[0])
            by_status[status_value] = row[1]

        # By departement
        dept_query = select(
            PlumberProspect.departement,
            func.count(PlumberProspect.id)
        ).where(
            PlumberProspect.departement.isnot(None)
        ).group_by(PlumberProspect.departement)
        dept_result = await self.session.execute(dept_query)
        by_departement = {str(row[0]): row[1] for row in dept_result.all()}

        # Individuels vs societes
        indiv_result = await self.session.execute(
            select(func.count(PlumberProspect.id)).where(
                PlumberProspect.individuel == True
            )
        )
        individuels = indiv_result.scalar() or 0

        societes_result = await self.session.execute(
            select(func.count(PlumberProspect.id)).where(
                PlumberProspect.individuel == False
            )
        )
        societes = societes_result.scalar() or 0

        return ProspectStats(
            total=total,
            with_telephone=with_telephone,
            with_email=with_email,
            by_status=by_status,
            by_departement=by_departement,
            individuels=individuels,
            societes=societes,
        )

    async def update_prospect(
        self,
        prospect_id: UUID,
        contact_status: Optional[ContactStatus] = None,
        contact_notes: Optional[str] = None,
    ) -> Optional[PlumberProspect]:
        """Update prospect contact info."""
        prospect = await self.get_prospect(prospect_id)
        if not prospect:
            return None

        if contact_status is not None:
            prospect.contact_status = contact_status
            if contact_status in [ContactStatus.CONTACTED, ContactStatus.INTERESTED, ContactStatus.NOT_INTERESTED]:
                prospect.last_contacted_at = datetime.utcnow()

        if contact_notes is not None:
            prospect.contact_notes = contact_notes

        await self.session.commit()
        await self.session.refresh(prospect)
        return prospect

    async def bulk_update_status(
        self,
        prospect_ids: List[UUID],
        contact_status: ContactStatus,
    ) -> int:
        """Update status for multiple prospects."""
        updated = 0
        for pid in prospect_ids:
            prospect = await self.get_prospect(pid)
            if prospect:
                prospect.contact_status = contact_status
                if contact_status in [ContactStatus.CONTACTED, ContactStatus.INTERESTED, ContactStatus.NOT_INTERESTED]:
                    prospect.last_contacted_at = datetime.utcnow()
                updated += 1

        await self.session.commit()
        return updated

    async def import_csv(self, csv_content: str) -> ImportResult:
        """Import prospects from CSV content."""
        reader = csv.DictReader(StringIO(csv_content))

        created = 0
        updated = 0
        errors = []
        total_rows = 0

        for row in reader:
            total_rows += 1
            try:
                # Clean and normalize data
                siren = row.get('siren', '').strip() or None
                telephone = self._normalize_phone(row.get('telephone', ''))

                # Try to find existing prospect
                existing = await self._find_existing_prospect(siren, telephone)

                if existing:
                    # Update existing (merge, don't overwrite)
                    self._merge_prospect_data(existing, row)
                    updated += 1
                else:
                    # Create new prospect
                    prospect = self._create_prospect_from_row(row)
                    self.session.add(prospect)
                    created += 1

            except Exception as e:
                errors.append(f"Row {total_rows}: {str(e)}")

        await self.session.commit()

        return ImportResult(
            total_rows=total_rows,
            created=created,
            updated=updated,
            errors=errors[:20],  # Limit errors to first 20
        )

    async def _find_existing_prospect(
        self,
        siren: Optional[str],
        telephone: Optional[str],
    ) -> Optional[PlumberProspect]:
        """Find existing prospect by SIREN or phone."""
        if siren:
            result = await self.session.execute(
                select(PlumberProspect).where(PlumberProspect.siren == siren)
            )
            existing = result.scalar_one_or_none()
            if existing:
                return existing

        if telephone:
            result = await self.session.execute(
                select(PlumberProspect).where(PlumberProspect.telephone == telephone)
            )
            existing = result.scalar_one_or_none()
            if existing:
                return existing

        return None

    def _normalize_phone(self, phone: str) -> Optional[str]:
        """Normalize phone number."""
        if not phone:
            return None
        # Remove spaces, dots, dashes
        phone = ''.join(c for c in phone if c.isdigit() or c == '+')
        return phone if phone else None

    def _merge_prospect_data(self, prospect: PlumberProspect, row: dict) -> None:
        """Merge new data into existing prospect (don't overwrite existing values)."""
        fields = [
            'siret', 'raison_sociale', 'nom_dirigeant', 'prenom_dirigeant',
            'code_ape', 'forme_juridique', 'adresse', 'code_postal', 'ville',
            'departement', 'telephone_2', 'email', 'site_web', 'date_creation',
            'certifications', 'provenance', 'sources',
        ]

        for field in fields:
            current_value = getattr(prospect, field)
            new_value = row.get(field, '').strip() or None
            if not current_value and new_value:
                setattr(prospect, field, new_value)

        # Special handling for numeric fields
        if not prospect.note_avis and row.get('note_avis'):
            try:
                prospect.note_avis = float(row['note_avis'])
            except (ValueError, TypeError):
                pass

        if not prospect.nb_avis and row.get('nb_avis'):
            try:
                prospect.nb_avis = int(row['nb_avis'])
            except (ValueError, TypeError):
                pass

        # Handle boolean
        if prospect.individuel is None and row.get('individuel'):
            prospect.individuel = row['individuel'].upper() in ('OUI', 'TRUE', '1', 'YES')

    def _create_prospect_from_row(self, row: dict) -> PlumberProspect:
        """Create a new prospect from CSV row."""
        individuel = None
        if row.get('individuel'):
            individuel = row['individuel'].upper() in ('OUI', 'TRUE', '1', 'YES')

        note_avis = None
        if row.get('note_avis'):
            try:
                note_avis = float(row['note_avis'])
            except (ValueError, TypeError):
                pass

        nb_avis = None
        if row.get('nb_avis'):
            try:
                nb_avis = int(row['nb_avis'])
            except (ValueError, TypeError):
                pass

        return PlumberProspect(
            siren=row.get('siren', '').strip() or None,
            siret=row.get('siret', '').strip() or None,
            raison_sociale=row.get('raison_sociale', '').strip() or None,
            nom_dirigeant=row.get('nom_dirigeant', '').strip() or None,
            prenom_dirigeant=row.get('prenom_dirigeant', '').strip() or None,
            code_ape=row.get('code_ape', '').strip() or None,
            forme_juridique=row.get('forme_juridique', '').strip() or None,
            adresse=row.get('adresse', '').strip() or None,
            code_postal=row.get('code_postal', '').strip() or None,
            ville=row.get('ville', '').strip() or None,
            departement=row.get('departement', '').strip() or None,
            telephone=self._normalize_phone(row.get('telephone', '')),
            telephone_2=self._normalize_phone(row.get('telephone_2', '')),
            email=row.get('email', '').strip() or None,
            site_web=row.get('site_web', '').strip() or None,
            date_creation=row.get('date_creation', '').strip() or None,
            certifications=row.get('certifications', '').strip() or None,
            note_avis=note_avis,
            nb_avis=nb_avis,
            statut=row.get('statut', '').strip() or None,
            individuel=individuel,
            provenance=row.get('provenance', '').strip() or None,
            sources=row.get('sources', '').strip() or None,
            date_extraction=row.get('date_extraction', '').strip() or None,
            source=row.get('source', '').strip() or None,
        )

    async def link_plumber_to_prospect(
        self,
        plumber: PlumberProfile,
        siren: Optional[str] = None,
        phone: Optional[str] = None,
    ) -> Optional[PlumberProspect]:
        """Auto-link a registered plumber to their prospect record."""
        prospect = await self._find_existing_prospect(siren, phone)

        if prospect and prospect.linked_plumber_id is None:
            prospect.contact_status = ContactStatus.REGISTERED
            prospect.linked_plumber_id = plumber.id
            await self.session.commit()
            await self.session.refresh(prospect)
            return prospect

        return None
