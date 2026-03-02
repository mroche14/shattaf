"""Plumber prospect model for managing extracted leads."""

from datetime import datetime
from enum import Enum
from typing import Optional, TYPE_CHECKING
from uuid import UUID
from sqlmodel import Field, Relationship, Column, Text

from .base import BaseModel

if TYPE_CHECKING:
    from .plumber import PlumberProfile


class ContactStatus(str, Enum):
    """Contact status for prospects."""

    NOT_CONTACTED = "not_contacted"
    CONTACTED = "contacted"
    INTERESTED = "interested"
    NOT_INTERESTED = "not_interested"
    REGISTERED = "registered"


class PlumberProspect(BaseModel, table=True):
    """Plumber prospect from CSV extraction."""

    __tablename__ = "plumber_prospects"

    # Business identification
    siren: Optional[str] = Field(default=None, index=True)
    siret: Optional[str] = None
    raison_sociale: Optional[str] = None
    nom_dirigeant: Optional[str] = None
    prenom_dirigeant: Optional[str] = None
    code_ape: Optional[str] = None
    forme_juridique: Optional[str] = None

    # Address
    adresse: Optional[str] = None
    code_postal: Optional[str] = None
    ville: Optional[str] = None
    departement: Optional[str] = Field(default=None, index=True)

    # Contact info
    telephone: Optional[str] = Field(default=None, index=True)
    telephone_2: Optional[str] = None
    email: Optional[str] = None
    site_web: Optional[str] = None

    # Business info
    date_creation: Optional[str] = None
    certifications: Optional[str] = None
    note_avis: Optional[float] = None
    nb_avis: Optional[int] = None
    statut: Optional[str] = None
    individuel: Optional[bool] = None

    # Data source tracking
    provenance: Optional[str] = None
    sources: Optional[str] = None
    date_extraction: Optional[str] = None
    source: Optional[str] = None

    # Geocoding
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    geocoded_at: Optional[datetime] = None

    # Contact tracking
    contact_status: ContactStatus = Field(default=ContactStatus.NOT_CONTACTED, index=True)
    contact_notes: Optional[str] = Field(default=None, sa_column=Column(Text))
    last_contacted_at: Optional[datetime] = None

    # Link to registered plumber
    linked_plumber_id: Optional[UUID] = Field(
        default=None,
        foreign_key="plumber_profiles.id",
        index=True
    )

    # Relationship
    linked_plumber: Optional["PlumberProfile"] = Relationship()
