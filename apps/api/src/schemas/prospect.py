"""Prospect schemas for API validation."""

from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, ConfigDict

from ..models.prospect import ContactStatus


def to_camel(string: str) -> str:
    """Convert snake_case to camelCase."""
    components = string.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])


class ProspectBase(BaseModel):
    """Base prospect schema."""

    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )


class ProspectResponse(ProspectBase):
    """Prospect response for API."""

    id: UUID
    siren: Optional[str] = None
    siret: Optional[str] = None
    raison_sociale: Optional[str] = None
    nom_dirigeant: Optional[str] = None
    prenom_dirigeant: Optional[str] = None
    code_ape: Optional[str] = None
    forme_juridique: Optional[str] = None

    adresse: Optional[str] = None
    code_postal: Optional[str] = None
    ville: Optional[str] = None
    departement: Optional[str] = None

    telephone: Optional[str] = None
    telephone_2: Optional[str] = None
    email: Optional[str] = None
    site_web: Optional[str] = None

    date_creation: Optional[str] = None
    certifications: Optional[str] = None
    note_avis: Optional[float] = None
    nb_avis: Optional[int] = None
    statut: Optional[str] = None
    individuel: Optional[bool] = None

    provenance: Optional[str] = None
    sources: Optional[str] = None

    contact_status: ContactStatus
    contact_notes: Optional[str] = None
    last_contacted_at: Optional[datetime] = None
    linked_plumber_id: Optional[UUID] = None

    created_at: datetime
    updated_at: Optional[datetime] = None


class ProspectUpdate(BaseModel):
    """Update prospect (status and notes)."""

    contact_status: Optional[ContactStatus] = None
    contact_notes: Optional[str] = None


class ProspectBulkStatusUpdate(BaseModel):
    """Bulk update prospect statuses."""

    prospect_ids: List[UUID]
    contact_status: ContactStatus


class ProspectFilters(BaseModel):
    """Filters for prospect listing."""

    departement: Optional[str] = None
    contact_status: Optional[ContactStatus] = None
    individuel: Optional[bool] = None
    has_telephone: Optional[bool] = None
    has_email: Optional[bool] = None
    search: Optional[str] = None
    page: int = 1
    limit: int = 50


class ProspectStats(ProspectBase):
    """Statistics for prospects."""

    total: int
    with_telephone: int
    with_email: int
    by_status: dict[str, int]
    by_departement: dict[str, int]
    individuels: int
    societes: int


class ProspectListResponse(ProspectBase):
    """Paginated list of prospects."""

    items: List[ProspectResponse]
    total: int
    page: int
    limit: int
    pages: int


class ImportResult(BaseModel):
    """Result of CSV import."""

    total_rows: int
    created: int
    updated: int
    errors: List[str]
