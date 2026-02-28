#!/usr/bin/env python3
"""
Migration script: SQLite to PostgreSQL with comprehensive mock data seeding.

This script:
1. Exports all existing data from SQLite (preserving hashed passwords)
2. Creates PostgreSQL schema
3. Imports existing users and profiles
4. Seeds comprehensive mock data for all entities
5. Imports plumber prospects from CSV

Usage:
    cd apps/api
    source venv/bin/activate
    python scripts/migrate_to_postgres.py
"""

import asyncio
import csv
import json
import os
import random
import sqlite3
import sys
from datetime import datetime, timedelta, date
from decimal import Decimal
from io import StringIO
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import uuid4

# Set up proper module paths
api_root = Path(__file__).parent.parent
sys.path.insert(0, str(api_root))
os.chdir(api_root)

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel


# =============================================================================
# Configuration
# =============================================================================

SQLITE_PATH = api_root / "data" / "shattaf_dev.db"
POSTGRES_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/shattaf"
CSV_PATH = api_root.parent.parent / "extractions-plombier" / "processed" / "plombiers_final.csv"

# Target counts for seeding
TARGET_PLUMBERS = {"971": 50, "972": 50, "973": 30}  # 130 total
TARGET_CUSTOMERS = 100
TARGET_BOOKINGS = 200
TARGET_QUOTES = 150
TARGET_ORDERS = 100
TARGET_SUPPORT_TICKETS = 20
TARGET_AUDIT_LOGS = 500


# =============================================================================
# Data Generation Helpers
# =============================================================================

FIRST_NAMES = [
    "Marie", "Jean", "Pierre", "Sophie", "Lucas", "Emma", "Louis", "Léa",
    "Gabriel", "Manon", "Raphaël", "Chloé", "Arthur", "Inès", "Adam", "Jade",
    "Paul", "Louise", "Hugo", "Alice", "Nathan", "Lina", "Ethan", "Rose",
    "Théo", "Anna", "Noah", "Camille", "Léo", "Sarah", "Jules", "Eva",
    "Mathis", "Zoé", "Enzo", "Mila", "Tom", "Ambre", "Sacha", "Nina",
    "Antoine", "Juliette", "Clément", "Charlotte", "Maxime", "Agathe",
    "Olivier", "Isabelle", "François", "Catherine", "Michel", "Nathalie",
]

LAST_NAMES = [
    "Martin", "Bernard", "Thomas", "Petit", "Robert", "Richard", "Durand",
    "Dubois", "Moreau", "Laurent", "Simon", "Michel", "Lefebvre", "Leroy",
    "Roux", "David", "Bertrand", "Morel", "Fournier", "Girard", "Bonnet",
    "Dupont", "Lambert", "Fontaine", "Rousseau", "Vincent", "Muller", "Lefevre",
    "Faure", "Andre", "Mercier", "Blanc", "Guerin", "Boyer", "Garnier",
    "Chevalier", "Schmitt", "Perrin", "Henry", "Dumas", "Legrand", "Marchand",
]

COMPANY_TEMPLATES = [
    "{last} Plomberie", "Ets {last}", "{last} & Fils", "Plomberie {last}",
    "{last} Services", "Pro Plomb {last}", "{last} Installation",
    "Atelier {last}", "{last} Sanitaire", "SCI {last}",
]

LOCATIONS = {
    "971": {  # Guadeloupe
        "name": "Guadeloupe",
        "cities": [
            {"name": "Pointe-à-Pitre", "lat": 16.2411, "lng": -61.5331, "postal": "97110"},
            {"name": "Les Abymes", "lat": 16.2703, "lng": -61.5044, "postal": "97139"},
            {"name": "Baie-Mahault", "lat": 16.2631, "lng": -61.5836, "postal": "97122"},
            {"name": "Le Gosier", "lat": 16.2078, "lng": -61.4928, "postal": "97190"},
            {"name": "Sainte-Anne", "lat": 16.2269, "lng": -61.3778, "postal": "97180"},
            {"name": "Petit-Bourg", "lat": 16.1919, "lng": -61.5892, "postal": "97170"},
            {"name": "Sainte-Rose", "lat": 16.3339, "lng": -61.6961, "postal": "97115"},
            {"name": "Capesterre-Belle-Eau", "lat": 16.0483, "lng": -61.5644, "postal": "97130"},
            {"name": "Le Moule", "lat": 16.3308, "lng": -61.3450, "postal": "97160"},
            {"name": "Morne-à-l'Eau", "lat": 16.3325, "lng": -61.4558, "postal": "97111"},
        ],
    },
    "972": {  # Martinique
        "name": "Martinique",
        "cities": [
            {"name": "Fort-de-France", "lat": 14.6091, "lng": -61.0628, "postal": "97200"},
            {"name": "Le Lamentin", "lat": 14.6139, "lng": -60.9925, "postal": "97232"},
            {"name": "Schoelcher", "lat": 14.6122, "lng": -61.0892, "postal": "97233"},
            {"name": "Sainte-Marie", "lat": 14.7844, "lng": -61.0158, "postal": "97230"},
            {"name": "Le Robert", "lat": 14.6775, "lng": -60.9389, "postal": "97231"},
            {"name": "Ducos", "lat": 14.5467, "lng": -60.9681, "postal": "97224"},
            {"name": "Le François", "lat": 14.6103, "lng": -60.9019, "postal": "97240"},
            {"name": "Saint-Joseph", "lat": 14.6656, "lng": -61.0436, "postal": "97212"},
            {"name": "Rivière-Pilote", "lat": 14.4708, "lng": -60.9017, "postal": "97211"},
            {"name": "Trinité", "lat": 14.7378, "lng": -60.9650, "postal": "97220"},
        ],
    },
    "973": {  # Guyane
        "name": "Guyane",
        "cities": [
            {"name": "Cayenne", "lat": 4.9372, "lng": -52.3261, "postal": "97300"},
            {"name": "Kourou", "lat": 5.1579, "lng": -52.6497, "postal": "97310"},
            {"name": "Matoury", "lat": 4.8550, "lng": -52.3272, "postal": "97351"},
            {"name": "Remire-Montjoly", "lat": 4.8883, "lng": -52.2717, "postal": "97354"},
            {"name": "Saint-Laurent-du-Maroni", "lat": 5.5033, "lng": -54.0333, "postal": "97320"},
            {"name": "Macouria", "lat": 4.9081, "lng": -52.4544, "postal": "97355"},
        ],
    },
}

STREET_TEMPLATES = [
    "Rue de la {}", "Avenue {}", "Boulevard {}", "Chemin de {}",
    "Allée des {}", "Impasse {}", "Résidence {}", "Lotissement {}",
]

STREET_NAMES = [
    "Liberté", "République", "Victoire", "Paix", "Espérance",
    "Palmiers", "Cocotiers", "Manguiers", "Hibiscus", "Flamboyants",
    "Colibris", "Aras", "Perroquets", "Mairie", "Église",
    "Port", "Plage", "Mer", "Montagne", "Forêt",
]

_phone_counter = 1000


def gen_phone(dept: str) -> str:
    """Generate unique phone number."""
    global _phone_counter
    _phone_counter += 1
    prefix = {"971": "0690", "972": "0696", "973": "0694"}.get(dept, "0690")
    return f"{prefix}{_phone_counter:06d}"


def gen_street() -> str:
    """Generate random street address."""
    template = random.choice(STREET_TEMPLATES)
    name = random.choice(STREET_NAMES)
    number = random.randint(1, 150)
    return f"{number} {template.format(name)}"


def add_noise(lat: float, lng: float, km_range: float = 5.0) -> tuple:
    """Add random noise to coordinates."""
    lat_noise = random.uniform(-km_range / 111, km_range / 111)
    lng_noise = random.uniform(-km_range / 111, km_range / 111)
    return lat + lat_noise, lng + lng_noise


def gen_uuid() -> str:
    """Generate UUID as hex string (32 chars, no dashes)."""
    return uuid4().hex


def gen_siren() -> str:
    """Generate fake SIREN number."""
    return f"{random.randint(100, 999)}{random.randint(100, 999)}{random.randint(100, 999)}"


def gen_siret(siren: str) -> str:
    """Generate SIRET from SIREN."""
    return f"{siren}{random.randint(10000, 99999)}"


def parse_datetime(value: Any) -> Optional[datetime]:
    """Parse datetime from string or return datetime as-is."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        # Try various formats
        for fmt in [
            "%Y-%m-%dT%H:%M:%S.%f",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%d %H:%M:%S.%f",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d",
        ]:
            try:
                return datetime.strptime(value, fmt)
            except ValueError:
                continue
    return None


def parse_date(value: Any) -> Optional[date]:
    """Parse date from string or return date as-is."""
    if value is None:
        return None
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, str):
        try:
            return datetime.strptime(value[:10], "%Y-%m-%d").date()
        except ValueError:
            return None
    return None


# =============================================================================
# SQLite Export Functions
# =============================================================================

def export_sqlite_data() -> Dict[str, List[Dict]]:
    """Export all data from SQLite database."""
    if not SQLITE_PATH.exists():
        print(f"  No SQLite database found at {SQLITE_PATH}")
        return {}

    print(f"  Reading from {SQLITE_PATH}")
    conn = sqlite3.connect(SQLITE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    data = {}

    # Tables to export (in dependency order)
    tables = [
        "users",
        "customer_profiles",
        "plumber_profiles",
        "products",
        "pricing_config",
        "bookings",
        "quotes",
        "orders",
        "order_items",
        "jobs",
        "job_photos",
        "invoices",
        "invoice_items",
        "mandates",
        "support_tickets",
        "audit_logs",
        "plumber_prospects",
    ]

    for table in tables:
        try:
            cursor.execute(f"SELECT * FROM {table}")
            rows = cursor.fetchall()
            data[table] = [dict(row) for row in rows]
            print(f"    Exported {len(data[table])} rows from {table}")
        except sqlite3.OperationalError as e:
            print(f"    Skipping {table}: {e}")
            data[table] = []

    conn.close()
    return data


# =============================================================================
# PostgreSQL Import Functions
# =============================================================================

async def create_postgres_schema(engine):
    """Create all tables in PostgreSQL."""
    # Import all models to register them
    from src import models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    print("  PostgreSQL schema created")


async def import_users(conn, users: List[Dict], existing_emails: set) -> Dict[str, str]:
    """Import users preserving hashed passwords. Returns mapping of old_id -> new_id."""
    id_map = {}
    imported = 0

    for user in users:
        email = user.get("email", "")
        if email in existing_emails:
            # Get existing ID
            result = await conn.execute(
                text("SELECT id FROM users WHERE email = :email"),
                {"email": email}
            )
            row = result.fetchone()
            if row:
                id_map[user["id"]] = row[0]
            continue

        # Normalize role to uppercase (PostgreSQL enum uses uppercase)
        role = user.get("role", "CUSTOMER")
        if isinstance(role, str):
            role = role.upper()

        new_id = gen_uuid()
        id_map[user["id"]] = new_id

        await conn.execute(
            text("""
                INSERT INTO users (id, created_at, updated_at, email, phone, hashed_password,
                    first_name, last_name, role, is_active, is_verified, avatar_url)
                VALUES (:id, :created_at, :updated_at, :email, :phone, :hashed_password,
                    :first_name, :last_name, :role, :is_active, :is_verified, :avatar_url)
            """),
            {
                "id": new_id,
                "created_at": parse_datetime(user.get("created_at")) or datetime.utcnow(),
                "updated_at": parse_datetime(user.get("updated_at")),
                "email": email,
                "phone": user.get("phone", f"000{imported:07d}"),
                "hashed_password": user["hashed_password"],
                "first_name": user.get("first_name", "Unknown"),
                "last_name": user.get("last_name", "User"),
                "role": role,
                "is_active": bool(user.get("is_active", True)),
                "is_verified": bool(user.get("is_verified", False)),
                "avatar_url": user.get("avatar_url"),
            }
        )
        existing_emails.add(email)
        imported += 1

    print(f"    Imported {imported} users")
    return id_map


async def import_customer_profiles(conn, profiles: List[Dict], user_id_map: Dict[str, str]):
    """Import customer profiles."""
    imported = 0
    for profile in profiles:
        old_user_id = profile.get("user_id")
        if old_user_id not in user_id_map:
            continue

        new_id = gen_uuid()
        await conn.execute(
            text("""
                INSERT INTO customer_profiles (id, created_at, updated_at, user_id, address_street,
                    address_city, address_postal_code, address_country, address_lat, address_lng,
                    floor, digicode, access_notes, stripe_customer_id)
                VALUES (:id, :created_at, :updated_at, :user_id, :address_street,
                    :address_city, :address_postal_code, :address_country, :address_lat, :address_lng,
                    :floor, :digicode, :access_notes, :stripe_customer_id)
            """),
            {
                "id": new_id,
                "created_at": parse_datetime(profile.get("created_at")) or datetime.utcnow(),
                "updated_at": parse_datetime(profile.get("updated_at")),
                "user_id": user_id_map[old_user_id],
                "address_street": profile.get("address_street"),
                "address_city": profile.get("address_city"),
                "address_postal_code": profile.get("address_postal_code"),
                "address_country": profile.get("address_country", "Guadeloupe"),
                "address_lat": profile.get("address_lat"),
                "address_lng": profile.get("address_lng"),
                "floor": profile.get("floor"),
                "digicode": profile.get("digicode"),
                "access_notes": profile.get("access_notes"),
                "stripe_customer_id": profile.get("stripe_customer_id"),
            }
        )
        imported += 1

    print(f"    Imported {imported} customer profiles")


async def import_plumber_profiles(conn, profiles: List[Dict], user_id_map: Dict[str, str]):
    """Import plumber profiles."""
    imported = 0
    for profile in profiles:
        old_user_id = profile.get("user_id")
        if old_user_id not in user_id_map:
            continue

        # Normalize status to uppercase
        status = profile.get("status", "ACTIVE")
        if isinstance(status, str):
            status = status.upper()

        # Handle intervention_locations
        intervention_locs = profile.get("intervention_locations")
        if isinstance(intervention_locs, str):
            try:
                intervention_locs = json.loads(intervention_locs)
            except:
                intervention_locs = []

        new_id = gen_uuid()
        await conn.execute(
            text("""
                INSERT INTO plumber_profiles (id, created_at, updated_at, user_id, status, department,
                    intervention_locations, company_name, siren, siret, vat_number,
                    insurance_company, insurance_policy_number, insurance_expiry_date, insurance_document_url,
                    qualification_doc_url, years_experience, stripe_account_id, stripe_onboarding_complete,
                    stripe_charges_enabled, stripe_payouts_enabled, service_area_lat, service_area_lng,
                    service_area_radius_km, total_jobs_completed, average_rating, total_ratings,
                    mandate_signed, mandate_signed_at, mandate_document_url)
                VALUES (:id, :created_at, :updated_at, :user_id, :status, :department,
                    :intervention_locations, :company_name, :siren, :siret, :vat_number,
                    :insurance_company, :insurance_policy_number, :insurance_expiry_date, :insurance_document_url,
                    :qualification_doc_url, :years_experience, :stripe_account_id, :stripe_onboarding_complete,
                    :stripe_charges_enabled, :stripe_payouts_enabled, :service_area_lat, :service_area_lng,
                    :service_area_radius_km, :total_jobs_completed, :average_rating, :total_ratings,
                    :mandate_signed, :mandate_signed_at, :mandate_document_url)
            """),
            {
                "id": new_id,
                "created_at": parse_datetime(profile.get("created_at")) or datetime.utcnow(),
                "updated_at": parse_datetime(profile.get("updated_at")),
                "user_id": user_id_map[old_user_id],
                "status": status,
                "department": profile.get("department"),
                "intervention_locations": json.dumps(intervention_locs) if intervention_locs else None,
                "company_name": profile.get("company_name"),
                "siren": profile.get("siren"),
                "siret": profile.get("siret"),
                "vat_number": profile.get("vat_number"),
                "insurance_company": profile.get("insurance_company"),
                "insurance_policy_number": profile.get("insurance_policy_number"),
                "insurance_expiry_date": parse_date(profile.get("insurance_expiry_date")),
                "insurance_document_url": profile.get("insurance_document_url"),
                "qualification_doc_url": profile.get("qualification_doc_url"),
                "years_experience": profile.get("years_experience"),
                "stripe_account_id": profile.get("stripe_account_id"),
                "stripe_onboarding_complete": bool(profile.get("stripe_onboarding_complete", False)),
                "stripe_charges_enabled": bool(profile.get("stripe_charges_enabled", False)),
                "stripe_payouts_enabled": bool(profile.get("stripe_payouts_enabled", False)),
                "service_area_lat": profile.get("service_area_lat"),
                "service_area_lng": profile.get("service_area_lng"),
                "service_area_radius_km": profile.get("service_area_radius_km", 30.0),
                "total_jobs_completed": profile.get("total_jobs_completed", 0),
                "average_rating": profile.get("average_rating"),
                "total_ratings": profile.get("total_ratings", 0),
                "mandate_signed": bool(profile.get("mandate_signed", False)),
                "mandate_signed_at": parse_datetime(profile.get("mandate_signed_at")),
                "mandate_document_url": profile.get("mandate_document_url"),
            }
        )
        imported += 1

    print(f"    Imported {imported} plumber profiles")


async def import_products(conn, products: List[Dict]) -> Dict[str, str]:
    """Import products. Returns mapping of old_id -> new_id."""
    id_map = {}
    imported = 0

    for product in products:
        new_id = gen_uuid()
        old_id = product.get("id")
        if old_id:
            id_map[old_id] = new_id

        # Handle JSON fields
        gallery_urls = product.get("gallery_urls")
        if isinstance(gallery_urls, str):
            try:
                gallery_urls = json.loads(gallery_urls)
            except:
                gallery_urls = []

        specifications = product.get("specifications")
        if isinstance(specifications, str):
            try:
                specifications = json.loads(specifications)
            except:
                specifications = {}

        await conn.execute(
            text("""
                INSERT INTO products (id, created_at, updated_at, sku, name, description, category,
                    supplier_price, price_b2c, price_b2b, vat_rate, stock_quantity, is_available,
                    image_url, gallery_urls, specifications, weight_grams,
                    requires_installation, installation_time_minutes, installation_price)
                VALUES (:id, :created_at, :updated_at, :sku, :name, :description, :category,
                    :supplier_price, :price_b2c, :price_b2b, :vat_rate, :stock_quantity, :is_available,
                    :image_url, :gallery_urls, :specifications, :weight_grams,
                    :requires_installation, :installation_time_minutes, :installation_price)
            """),
            {
                "id": new_id,
                "created_at": parse_datetime(product.get("created_at")) or datetime.utcnow(),
                "updated_at": parse_datetime(product.get("updated_at")),
                "sku": product.get("sku"),
                "name": product.get("name"),
                "description": product.get("description"),
                "category": product.get("category", "SHATTAF"),
                "supplier_price": product.get("supplier_price", 0),
                "price_b2c": product.get("price_b2c", 0),
                "price_b2b": product.get("price_b2b", 0),
                "vat_rate": str(product.get("vat_rate", "8.5")),
                "stock_quantity": product.get("stock_quantity", 0),
                "is_available": bool(product.get("is_available", True)),
                "image_url": product.get("image_url"),
                "gallery_urls": json.dumps(gallery_urls) if gallery_urls else None,
                "specifications": json.dumps(specifications) if specifications else None,
                "weight_grams": product.get("weight_grams"),
                "requires_installation": bool(product.get("requires_installation", True)),
                "installation_time_minutes": product.get("installation_time_minutes", 30),
                "installation_price": product.get("installation_price", 5000),
            }
        )
        imported += 1

    print(f"    Imported {imported} products")
    return id_map


async def import_prospects(conn, prospects: List[Dict]):
    """Import plumber prospects."""
    imported = 0
    for prospect in prospects:
        new_id = gen_uuid()

        # Handle boolean field
        individuel = prospect.get("individuel")
        if isinstance(individuel, str):
            individuel = individuel.upper() in ("OUI", "TRUE", "1", "YES")
        elif individuel is not None:
            individuel = bool(individuel)

        await conn.execute(
            text("""
                INSERT INTO plumber_prospects (id, created_at, updated_at, siren, siret, raison_sociale,
                    nom_dirigeant, prenom_dirigeant, code_ape, forme_juridique, adresse, code_postal,
                    ville, departement, telephone, telephone_2, email, site_web, date_creation,
                    certifications, note_avis, nb_avis, statut, individuel, provenance, sources,
                    date_extraction, source, contact_status, contact_notes, last_contacted_at)
                VALUES (:id, :created_at, :updated_at, :siren, :siret, :raison_sociale,
                    :nom_dirigeant, :prenom_dirigeant, :code_ape, :forme_juridique, :adresse, :code_postal,
                    :ville, :departement, :telephone, :telephone_2, :email, :site_web, :date_creation,
                    :certifications, :note_avis, :nb_avis, :statut, :individuel, :provenance, :sources,
                    :date_extraction, :source, :contact_status, :contact_notes, :last_contacted_at)
            """),
            {
                "id": new_id,
                "created_at": parse_datetime(prospect.get("created_at")) or datetime.utcnow(),
                "updated_at": parse_datetime(prospect.get("updated_at")),
                "siren": prospect.get("siren"),
                "siret": prospect.get("siret"),
                "raison_sociale": prospect.get("raison_sociale"),
                "nom_dirigeant": prospect.get("nom_dirigeant"),
                "prenom_dirigeant": prospect.get("prenom_dirigeant"),
                "code_ape": prospect.get("code_ape"),
                "forme_juridique": prospect.get("forme_juridique"),
                "adresse": prospect.get("adresse"),
                "code_postal": prospect.get("code_postal"),
                "ville": prospect.get("ville"),
                "departement": prospect.get("departement"),
                "telephone": prospect.get("telephone"),
                "telephone_2": prospect.get("telephone_2"),
                "email": prospect.get("email"),
                "site_web": prospect.get("site_web"),
                "date_creation": prospect.get("date_creation"),
                "certifications": prospect.get("certifications"),
                "note_avis": prospect.get("note_avis"),
                "nb_avis": prospect.get("nb_avis"),
                "statut": prospect.get("statut"),
                "individuel": individuel,
                "provenance": prospect.get("provenance"),
                "sources": prospect.get("sources"),
                "date_extraction": prospect.get("date_extraction"),
                "source": prospect.get("source"),
                "contact_status": prospect.get("contact_status", "NOT_CONTACTED"),
                "contact_notes": prospect.get("contact_notes"),
                "last_contacted_at": parse_datetime(prospect.get("last_contacted_at")),
            }
        )
        imported += 1

    print(f"    Imported {imported} prospects")


# =============================================================================
# Seed New Mock Data
# =============================================================================

async def seed_products(conn) -> List[str]:
    """Seed default products if none exist. Returns product IDs."""
    result = await conn.execute(text("SELECT COUNT(*) FROM products"))
    if result.scalar() > 0:
        result = await conn.execute(text("SELECT id FROM products WHERE category = 'SHATTAF' LIMIT 5"))
        return [row[0] for row in result.fetchall()]

    now = datetime.utcnow()
    products = [
        ("SHATTAF-CLASSIC", "Shattaf Classique", "Douchette WC classique avec flexible inox et support mural. Installation facile.", "SHATTAF", 1500, 4900, 3900, 150, True, "https://placehold.co/400x400/06b6d4/white?text=Classic", 450, True, 30, 5000),
        ("SHATTAF-PREMIUM", "Shattaf Premium", "Douchette WC premium tout métal avec double jet et finition chromée.", "SHATTAF", 2500, 7900, 6500, 75, True, "https://placehold.co/400x400/8b5cf6/white?text=Premium", 680, True, 45, 5500),
        ("SHATTAF-ECO", "Shattaf Eco", "Douchette WC économique pour petit budget. Qualité correcte.", "SHATTAF", 800, 2900, 2400, 200, True, "https://placehold.co/400x400/10b981/white?text=Eco", 320, True, 25, 4500),
        ("KIT-RACCORD", "Kit Raccordement Universel", "Kit de raccordement avec té de dérivation et joints. Compatible tous WC.", "KIT", 500, 1500, 1200, 300, True, "https://placehold.co/400x400/f59e0b/white?text=Kit", 180, False, 0, 0),
        ("ACC-SUPPORT-MURAL", "Support Mural Inox", "Support mural en inox pour douchette WC. Fixation solide.", "ACCESSORY", 300, 990, 800, 250, True, "https://placehold.co/400x400/64748b/white?text=Support", 85, False, 0, 0),
    ]

    product_ids = []
    for sku, name, desc, cat, supp, b2c, b2b, stock, avail, img, weight, req_inst, inst_time, inst_price in products:
        pid = gen_uuid()
        product_ids.append(pid)
        await conn.execute(
            text("""
                INSERT INTO products (id, created_at, sku, name, description, category, supplier_price,
                    price_b2c, price_b2b, vat_rate, stock_quantity, is_available, image_url, weight_grams,
                    requires_installation, installation_time_minutes, installation_price)
                VALUES (:id, :created_at, :sku, :name, :description, :category, :supplier_price,
                    :price_b2c, :price_b2b, :vat_rate, :stock_quantity, :is_available, :image_url, :weight_grams,
                    :requires_installation, :installation_time_minutes, :installation_price)
            """),
            {
                "id": pid, "created_at": now, "sku": sku, "name": name, "description": desc,
                "category": cat, "supplier_price": supp, "price_b2c": b2c, "price_b2b": b2b,
                "vat_rate": "8.5", "stock_quantity": stock, "is_available": avail, "image_url": img,
                "weight_grams": weight, "requires_installation": req_inst,
                "installation_time_minutes": inst_time, "installation_price": inst_price
            }
        )

    print(f"  Seeded {len(products)} products")
    return product_ids[:3]  # Return only shattaf products


async def seed_pricing_config(conn):
    """Seed pricing configuration."""
    result = await conn.execute(text("SELECT COUNT(*) FROM pricing_config"))
    if result.scalar() > 0:
        print("  Pricing config already exists")
        return

    await conn.execute(
        text("""
            INSERT INTO pricing_config (id, created_at, name, plumber_travel_fee, plumber_labor_fee,
                commission_first_unit, commission_additional, b2b_discount_percent, notes)
            VALUES (:id, :created_at, 'default', 2000, 5000, 4000, 1000, 15, 'Configuration DOM-TOM (TVA 8.5%)')
        """),
        {"id": gen_uuid(), "created_at": datetime.utcnow()}
    )
    print("  Seeded pricing config")


async def seed_plumbers(conn, existing_emails: set) -> List[Dict]:
    """Seed plumbers for each department. Returns list of plumber info."""
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hashed_pw = pwd_context.hash("plumber123")

    now = datetime.utcnow()
    plumbers = []

    for dept, count in TARGET_PLUMBERS.items():
        dept_info = LOCATIONS[dept]

        # Count existing plumbers in this department
        result = await conn.execute(
            text("SELECT COUNT(*) FROM plumber_profiles WHERE department = :dept"),
            {"dept": dept}
        )
        existing = result.scalar() or 0
        to_create = max(0, count - existing)

        if to_create == 0:
            # Get existing plumber IDs
            result = await conn.execute(
                text("SELECT user_id FROM plumber_profiles WHERE department = :dept AND status = 'ACTIVE'"),
                {"dept": dept}
            )
            for row in result.fetchall():
                plumbers.append({"user_id": row[0], "department": dept})
            continue

        for i in range(to_create):
            first_name = random.choice(FIRST_NAMES)
            last_name = random.choice(LAST_NAMES)
            city = random.choice(dept_info["cities"])
            email = f"plumber{dept}_{existing + i + 1}@shattaf.local"

            if email in existing_emails:
                continue
            existing_emails.add(email)

            user_id = gen_uuid()
            profile_id = gen_uuid()
            lat, lng = add_noise(city["lat"], city["lng"], km_range=8.0)

            # Create user
            await conn.execute(
                text("""
                    INSERT INTO users (id, created_at, email, phone, hashed_password, first_name, last_name,
                        role, is_active, is_verified)
                    VALUES (:id, :created_at, :email, :phone, :hashed_password, :first_name, :last_name,
                        :role, :is_active, :is_verified)
                """),
                {
                    "id": user_id, "created_at": now, "email": email,
                    "phone": gen_phone(dept), "hashed_password": hashed_pw,
                    "first_name": first_name, "last_name": last_name,
                    "role": "PLUMBER", "is_active": True, "is_verified": True
                }
            )

            # Intervention locations
            intervention_locs = []
            for _ in range(random.randint(1, 3)):
                loc_city = random.choice(dept_info["cities"])
                loc_lat, loc_lng = add_noise(loc_city["lat"], loc_city["lng"], km_range=3.0)
                intervention_locs.append({
                    "lat": loc_lat, "lng": loc_lng,
                    "address": f"{gen_street()}, {loc_city['postal']} {loc_city['name']}",
                    "label": loc_city["name"]
                })

            siren = gen_siren()
            company = random.choice(COMPANY_TEMPLATES).format(last=last_name)
            status = random.choices(["ACTIVE", "PENDING", "SUSPENDED"], weights=[85, 10, 5])[0]

            # Create plumber profile
            await conn.execute(
                text("""
                    INSERT INTO plumber_profiles (id, created_at, user_id, status, department,
                        intervention_locations, company_name, siren, siret, service_area_lat, service_area_lng,
                        service_area_radius_km, years_experience, total_jobs_completed, average_rating,
                        total_ratings, stripe_onboarding_complete, stripe_charges_enabled, stripe_payouts_enabled,
                        mandate_signed)
                    VALUES (:id, :created_at, :user_id, :status, :department,
                        :intervention_locations, :company_name, :siren, :siret, :service_area_lat, :service_area_lng,
                        :service_area_radius_km, :years_experience, :total_jobs_completed, :average_rating,
                        :total_ratings, :stripe_onboarding_complete, :stripe_charges_enabled, :stripe_payouts_enabled,
                        :mandate_signed)
                """),
                {
                    "id": profile_id, "created_at": now, "user_id": user_id,
                    "status": status, "department": dept,
                    "intervention_locations": json.dumps(intervention_locs),
                    "company_name": company, "siren": siren, "siret": gen_siret(siren),
                    "service_area_lat": lat, "service_area_lng": lng,
                    "service_area_radius_km": random.uniform(15.0, 40.0),
                    "years_experience": random.randint(2, 25),
                    "total_jobs_completed": random.randint(0, 150),
                    "average_rating": round(random.uniform(3.5, 5.0), 1) if random.random() > 0.2 else None,
                    "total_ratings": random.randint(0, 50),
                    "stripe_onboarding_complete": random.random() > 0.1,
                    "stripe_charges_enabled": random.random() > 0.1,
                    "stripe_payouts_enabled": random.random() > 0.1,
                    "mandate_signed": random.random() > 0.15,
                }
            )

            if status == "ACTIVE":
                plumbers.append({"user_id": user_id, "department": dept, "company": company, "siren": siren})

        print(f"  Seeded {to_create} plumbers in {dept_info['name']}")

    return plumbers


async def seed_customers(conn, existing_emails: set) -> List[Dict]:
    """Seed customers. Returns list of customer info."""
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hashed_pw = pwd_context.hash("customer123")

    now = datetime.utcnow()
    customers = []

    # Count existing customers
    result = await conn.execute(text("SELECT COUNT(*) FROM users WHERE role = 'CUSTOMER'"))
    existing = result.scalar() or 0
    to_create = max(0, TARGET_CUSTOMERS - existing)

    if to_create == 0:
        # Get existing customer IDs
        result = await conn.execute(
            text("SELECT u.id, cp.address_postal_code FROM users u JOIN customer_profiles cp ON u.id = cp.user_id WHERE u.role = 'CUSTOMER'")
        )
        for row in result.fetchall():
            postal = row[1] or "97110"
            dept = postal[:3] if len(postal) >= 3 else "971"
            customers.append({"user_id": row[0], "department": dept})
        print(f"  Using {len(customers)} existing customers")
        return customers

    for i in range(to_create):
        dept = random.choice(["971", "972", "973"])
        dept_info = LOCATIONS[dept]
        city = random.choice(dept_info["cities"])
        first_name = random.choice(FIRST_NAMES)
        last_name = random.choice(LAST_NAMES)
        email = f"customer{existing + i + 1}@example.local"

        if email in existing_emails:
            continue
        existing_emails.add(email)

        user_id = gen_uuid()
        profile_id = gen_uuid()
        lat, lng = add_noise(city["lat"], city["lng"], km_range=5.0)

        # Create user
        await conn.execute(
            text("""
                INSERT INTO users (id, created_at, email, phone, hashed_password, first_name, last_name,
                    role, is_active, is_verified)
                VALUES (:id, :created_at, :email, :phone, :hashed_password, :first_name, :last_name,
                    :role, :is_active, :is_verified)
            """),
            {
                "id": user_id, "created_at": now, "email": email,
                "phone": gen_phone(dept), "hashed_password": hashed_pw,
                "first_name": first_name, "last_name": last_name,
                "role": "CUSTOMER", "is_active": True, "is_verified": True
            }
        )

        # Create customer profile
        await conn.execute(
            text("""
                INSERT INTO customer_profiles (id, created_at, user_id, address_street, address_city,
                    address_postal_code, address_country, address_lat, address_lng, floor, digicode)
                VALUES (:id, :created_at, :user_id, :address_street, :address_city,
                    :address_postal_code, :address_country, :address_lat, :address_lng, :floor, :digicode)
            """),
            {
                "id": profile_id, "created_at": now, "user_id": user_id,
                "address_street": gen_street(), "address_city": city["name"],
                "address_postal_code": city["postal"], "address_country": dept_info["name"],
                "address_lat": lat, "address_lng": lng,
                "floor": random.choice([None, 0, 1, 2, 3]) if random.random() > 0.5 else None,
                "digicode": f"{random.randint(1000, 9999)}" if random.random() > 0.7 else None
            }
        )

        customers.append({
            "user_id": user_id, "department": dept, "city": city["name"],
            "postal": city["postal"], "lat": lat, "lng": lng,
            "name": f"{first_name} {last_name}", "email": email
        })

    print(f"  Seeded {to_create} customers")
    return customers


async def seed_bookings_and_workflow(conn, customers: List[Dict], plumbers: List[Dict], product_ids: List[str]):
    """Seed bookings, quotes, orders, jobs, and invoices."""
    now = datetime.utcnow()

    # Count existing bookings
    result = await conn.execute(text("SELECT COUNT(*) FROM bookings"))
    existing_bookings = result.scalar() or 0
    to_create = max(0, TARGET_BOOKINGS - existing_bookings)

    if to_create == 0:
        print("  Bookings already exist, skipping workflow seeding")
        return

    order_counter = 1
    invoice_counter = 1
    mandate_counter = 1

    # Status distribution
    status_weights = [
        ("DRAFT", 10),
        ("SUBMITTED", 20),
        ("QUOTED", 30),
        ("ACCEPTED", 100),
        ("EXPIRED", 5),
    ]
    statuses = [s for s, _ in status_weights]
    weights = [w for _, w in status_weights]

    bookings_created = 0
    quotes_created = 0
    orders_created = 0
    jobs_created = 0
    invoices_created = 0
    mandates_created = 0

    for i in range(to_create):
        customer = random.choice(customers)
        cust_dept = customer.get("department", "971")

        # Find plumber in same department
        dept_plumbers = [p for p in plumbers if p.get("department") == cust_dept]
        if not dept_plumbers:
            dept_plumbers = plumbers
        plumber = random.choice(dept_plumbers)

        product_id = random.choice(product_ids)
        status = random.choices(statuses, weights=weights)[0]

        # Timing
        if status == "ACCEPTED":
            days_ago = random.randint(1, 180)
            booking_date = now - timedelta(days=days_ago)
            scheduled_date = booking_date + timedelta(days=random.randint(1, 7))
            completed = random.random() > 0.3
        else:
            booking_date = now - timedelta(days=random.randint(0, 14))
            scheduled_date = now + timedelta(days=random.randint(1, 30))
            completed = False

        dept_info = LOCATIONS.get(cust_dept, LOCATIONS["971"])
        city = random.choice(dept_info["cities"])
        lat, lng = add_noise(city["lat"], city["lng"], km_range=5.0)

        booking_id = gen_uuid()

        await conn.execute(
            text("""
                INSERT INTO bookings (id, created_at, customer_id, status, address_street, address_city,
                    address_postal_code, address_country, address_lat, address_lng, toilet_type,
                    shutoff_valve_accessible, parking_available, product_id, preferred_date,
                    preferred_time_slot, assigned_plumber_id, additional_photo_urls)
                VALUES (:id, :created_at, :customer_id, :status, :address_street, :address_city,
                    :address_postal_code, :address_country, :address_lat, :address_lng, :toilet_type,
                    :shutoff_valve_accessible, :parking_available, :product_id, :preferred_date,
                    :preferred_time_slot, :assigned_plumber_id, :additional_photo_urls)
            """),
            {
                "id": booking_id, "created_at": booking_date,
                "customer_id": customer["user_id"], "status": status,
                "address_street": gen_street(), "address_city": city["name"],
                "address_postal_code": city["postal"], "address_country": dept_info["name"],
                "address_lat": lat, "address_lng": lng,
                "toilet_type": random.choice(["STANDARD", "WALL_HUNG"]),
                "shutoff_valve_accessible": random.random() > 0.1,
                "parking_available": random.random() > 0.3,
                "product_id": product_id,
                "preferred_date": scheduled_date,
                "preferred_time_slot": random.choice(["morning", "afternoon", "evening"]),
                "assigned_plumber_id": plumber["user_id"] if status in ["QUOTED", "ACCEPTED"] else None,
                "additional_photo_urls": "[]"
            }
        )
        bookings_created += 1

        # Create quote for QUOTED and ACCEPTED
        if status in ["QUOTED", "ACCEPTED"]:
            quote_id = gen_uuid()
            install_price = random.choice([4500, 5000, 5500, 6000])
            product_price = random.choice([2900, 4900, 7900])
            platform_fee = 4000
            total = install_price + product_price + platform_fee
            vat_amount = int(total * 0.085)

            quote_status = "ACCEPTED" if status == "ACCEPTED" else "PENDING"

            await conn.execute(
                text("""
                    INSERT INTO quotes (id, created_at, booking_id, plumber_id, status, installation_price,
                        product_price, platform_fee, total_price, vat_amount, price_excluding_vat,
                        proposed_date, proposed_time_slot, estimated_duration_minutes, valid_until)
                    VALUES (:id, :created_at, :booking_id, :plumber_id, :status, :installation_price,
                        :product_price, :platform_fee, :total_price, :vat_amount, :price_excluding_vat,
                        :proposed_date, :proposed_time_slot, :estimated_duration_minutes, :valid_until)
                """),
                {
                    "id": quote_id, "created_at": (booking_date + timedelta(hours=random.randint(1, 24))),
                    "booking_id": booking_id, "plumber_id": plumber["user_id"], "status": quote_status,
                    "installation_price": install_price, "product_price": product_price,
                    "platform_fee": platform_fee, "total_price": total,
                    "vat_amount": vat_amount, "price_excluding_vat": int(total / 1.085),
                    "proposed_date": scheduled_date,
                    "proposed_time_slot": random.choice(["morning", "afternoon"]),
                    "estimated_duration_minutes": random.choice([30, 45, 60]),
                    "valid_until": (scheduled_date + timedelta(days=7))
                }
            )
            quotes_created += 1

            # Create order, job, invoice for ACCEPTED
            if status == "ACCEPTED":
                order_id = gen_uuid()
                order_status = "COMPLETED" if completed else random.choice(["PAID", "SCHEDULED", "IN_PROGRESS"])
                payment_status = "CAPTURED" if completed else "AUTHORIZED"

                await conn.execute(
                    text("""
                        INSERT INTO orders (id, created_at, order_number, customer_id, plumber_id, booking_id,
                            quote_id, status, payment_status, product_subtotal, installation_subtotal,
                            platform_fee, vat_amount, total_amount, scheduled_date, scheduled_time_slot,
                            completed_at, customer_rating)
                        VALUES (:id, :created_at, :order_number, :customer_id, :plumber_id, :booking_id,
                            :quote_id, :status, :payment_status, :product_subtotal, :installation_subtotal,
                            :platform_fee, :vat_amount, :total_amount, :scheduled_date, :scheduled_time_slot,
                            :completed_at, :customer_rating)
                    """),
                    {
                        "id": order_id, "created_at": (booking_date + timedelta(days=1)),
                        "order_number": f"ORD-{2024}{order_counter:04d}",
                        "customer_id": customer["user_id"], "plumber_id": plumber["user_id"],
                        "booking_id": booking_id, "quote_id": quote_id,
                        "status": order_status, "payment_status": payment_status,
                        "product_subtotal": product_price, "installation_subtotal": install_price,
                        "platform_fee": platform_fee, "vat_amount": vat_amount, "total_amount": total,
                        "scheduled_date": scheduled_date,
                        "scheduled_time_slot": random.choice(["morning", "afternoon"]),
                        "completed_at": scheduled_date if completed else None,
                        "customer_rating": random.randint(3, 5) if completed and random.random() > 0.3 else None
                    }
                )
                order_counter += 1
                orders_created += 1

                # Create job
                job_id = gen_uuid()
                job_status = "COMPLETED" if completed else random.choice(["SCHEDULED", "EN_ROUTE", "CHECKED_IN", "IN_PROGRESS"])
                cust_name = customer.get("name", "Client")

                await conn.execute(
                    text("""
                        INSERT INTO jobs (id, created_at, order_id, plumber_id, status, scheduled_date,
                            checkin_time, checkin_lat, checkin_lng, start_time, work_started_at,
                            work_completed_at, completed_at, signature_name, photo_before_urls, photo_after_urls,
                            inventory_qr_scanned)
                        VALUES (:id, :created_at, :order_id, :plumber_id, :status, :scheduled_date,
                            :checkin_time, :checkin_lat, :checkin_lng, :start_time, :work_started_at,
                            :work_completed_at, :completed_at, :signature_name, :photo_before_urls, :photo_after_urls,
                            :inventory_qr_scanned)
                    """),
                    {
                        "id": job_id, "created_at": scheduled_date,
                        "order_id": order_id, "plumber_id": plumber["user_id"], "status": job_status,
                        "scheduled_date": scheduled_date,
                        "checkin_time": scheduled_date if completed else None,
                        "checkin_lat": lat + random.uniform(-0.001, 0.001) if completed else None,
                        "checkin_lng": lng + random.uniform(-0.001, 0.001) if completed else None,
                        "start_time": (scheduled_date + timedelta(minutes=10)) if completed else None,
                        "work_started_at": (scheduled_date + timedelta(minutes=10)) if completed else None,
                        "work_completed_at": (scheduled_date + timedelta(minutes=60)) if completed else None,
                        "completed_at": (scheduled_date + timedelta(minutes=60)) if completed else None,
                        "signature_name": cust_name if completed else "",
                        "photo_before_urls": "[]", "photo_after_urls": "[]",
                        "inventory_qr_scanned": completed
                    }
                )
                jobs_created += 1

                # Create invoice for completed jobs
                if completed:
                    invoice_id = gen_uuid()
                    plumber_company = plumber.get("company", "Plomberie")
                    plumber_siren = plumber.get("siren", gen_siren())

                    await conn.execute(
                        text("""
                            INSERT INTO invoices (id, created_at, invoice_number, order_id, status, issuer_name,
                                issuer_siren, issuer_address, customer_id, customer_name, customer_address,
                                customer_email, plumber_id, plumber_name, plumber_siren, invoice_date, due_date,
                                subtotal_products, subtotal_installation, vat_products, vat_installation,
                                total_excluding_vat, total_vat, total_amount, vat_rate, mandate_mention)
                            VALUES (:id, :created_at, :invoice_number, :order_id, :status, :issuer_name,
                                :issuer_siren, :issuer_address, :customer_id, :customer_name, :customer_address,
                                :customer_email, :plumber_id, :plumber_name, :plumber_siren, :invoice_date, :due_date,
                                :subtotal_products, :subtotal_installation, :vat_products, :vat_installation,
                                :total_excluding_vat, :total_vat, :total_amount, :vat_rate, :mandate_mention)
                        """),
                        {
                            "id": invoice_id, "created_at": scheduled_date,
                            "invoice_number": f"FAC-{2024}{invoice_counter:04d}",
                            "order_id": order_id, "status": "PAID",
                            "issuer_name": "Oasis Shattaf", "issuer_siren": "123456789",
                            "issuer_address": "Guadeloupe, France",
                            "customer_id": customer["user_id"], "customer_name": cust_name,
                            "customer_address": f"{city['name']}, {city['postal']}",
                            "customer_email": customer.get("email", "customer@example.com"),
                            "plumber_id": plumber["user_id"], "plumber_name": plumber_company,
                            "plumber_siren": plumber_siren,
                            "invoice_date": scheduled_date.date(),
                            "due_date": (scheduled_date + timedelta(days=30)).date(),
                            "subtotal_products": product_price, "subtotal_installation": install_price,
                            "vat_products": int(product_price * 0.085),
                            "vat_installation": int(install_price * 0.085),
                            "total_excluding_vat": int(total / 1.085),
                            "total_vat": vat_amount, "total_amount": total,
                            "vat_rate": "8.5",
                            "mandate_mention": "Facture émise par Oasis Shattaf en qualité de mandataire conformément à l'article 289-I-2 du CGI."
                        }
                    )
                    invoice_counter += 1
                    invoices_created += 1

                    # Create mandate for active plumbers
                    if mandate_counter <= 50:
                        mandate_id = gen_uuid()
                        await conn.execute(
                            text("""
                                INSERT INTO mandates (id, created_at, plumber_id, status, mandate_type,
                                    start_date, signed_at, signature_method, terms_version)
                                VALUES (:id, :created_at, :plumber_id, :status, :mandate_type,
                                    :start_date, :signed_at, :signature_method, :terms_version)
                            """),
                            {
                                "id": mandate_id, "created_at": now,
                                "plumber_id": plumber["user_id"], "status": "SIGNED",
                                "mandate_type": "billing",
                                "start_date": (now - timedelta(days=random.randint(30, 180))).date(),
                                "signed_at": (now - timedelta(days=random.randint(30, 180))),
                                "signature_method": "electronic", "terms_version": "1.0"
                            }
                        )
                        mandate_counter += 1
                        mandates_created += 1

    print(f"  Seeded {bookings_created} bookings")
    print(f"  Seeded {quotes_created} quotes")
    print(f"  Seeded {orders_created} orders")
    print(f"  Seeded {jobs_created} jobs")
    print(f"  Seeded {invoices_created} invoices")
    print(f"  Seeded {mandates_created} mandates")


async def seed_support_tickets(conn, customers: List[Dict]):
    """Seed support tickets."""
    result = await conn.execute(text("SELECT COUNT(*) FROM support_tickets"))
    if result.scalar() > 0:
        print("  Support tickets already exist")
        return

    now = datetime.utcnow()
    categories = ["PRODUCT_DEFECT", "INSTALLATION_ISSUE", "BILLING", "SCHEDULING", "OTHER"]
    statuses = ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER", "RESOLVED", "CLOSED"]

    for i in range(TARGET_SUPPORT_TICKETS):
        customer = random.choice(customers)
        ticket_id = gen_uuid()

        await conn.execute(
            text("""
                INSERT INTO support_tickets (id, created_at, ticket_number, customer_id, status, category,
                    priority, subject, description, is_product_issue, is_installation_issue)
                VALUES (:id, :created_at, :ticket_number, :customer_id, :status, :category,
                    :priority, :subject, :description, :is_product_issue, :is_installation_issue)
            """),
            {
                "id": ticket_id, "created_at": (now - timedelta(days=random.randint(0, 30))),
                "ticket_number": f"TKT-{2024}{i+1:04d}",
                "customer_id": customer["user_id"],
                "status": random.choice(statuses),
                "category": random.choice(categories),
                "priority": random.choice([1, 2, 2, 3]),
                "subject": random.choice([
                    "Problème de fuite après installation",
                    "Pièce manquante dans le kit",
                    "Demande de modification de RDV",
                    "Question sur la facture",
                    "Shattaf ne fonctionne plus",
                ]),
                "description": "Description détaillée du problème rencontré par le client.",
                "is_product_issue": random.random() > 0.5,
                "is_installation_issue": random.random() > 0.5
            }
        )

    print(f"  Seeded {TARGET_SUPPORT_TICKETS} support tickets")


async def seed_audit_logs(conn, customers: List[Dict], plumbers: List[Dict]):
    """Seed audit logs."""
    result = await conn.execute(text("SELECT COUNT(*) FROM audit_logs"))
    if result.scalar() > 0:
        print("  Audit logs already exist")
        return

    now = datetime.utcnow()
    actions = ["create", "update", "delete", "login", "logout"]
    resources = ["booking", "order", "invoice", "user", "quote", "job"]

    all_users = customers + plumbers

    for i in range(TARGET_AUDIT_LOGS):
        user = random.choice(all_users) if all_users else None
        log_id = gen_uuid()

        log_timestamp = now - timedelta(days=random.randint(0, 90), hours=random.randint(0, 23))
        await conn.execute(
            text("""
                INSERT INTO audit_logs (id, created_at, timestamp, user_id, user_email, user_role, action,
                    resource_type, resource_id, ip_address, user_agent)
                VALUES (:id, :created_at, :timestamp, :user_id, :user_email, :user_role, :action,
                    :resource_type, :resource_id, :ip_address, :user_agent)
            """),
            {
                "id": log_id,
                "created_at": log_timestamp,
                "timestamp": log_timestamp,
                "user_id": user["user_id"] if user else None,
                "user_email": user.get("email", "unknown@example.com") if user else None,
                "user_role": "CUSTOMER" if "customer" in user.get("email", "") else "PLUMBER" if user else None,
                "action": random.choice(actions),
                "resource_type": random.choice(resources),
                "resource_id": gen_uuid(),
                "ip_address": f"192.168.{random.randint(0, 255)}.{random.randint(1, 254)}",
                "user_agent": "Mozilla/5.0 (compatible; ShattafApp/1.0)"
            }
        )

    print(f"  Seeded {TARGET_AUDIT_LOGS} audit logs")


async def import_csv_prospects(conn):
    """Import prospects from CSV file if not already imported."""
    result = await conn.execute(text("SELECT COUNT(*) FROM plumber_prospects"))
    count = result.scalar() or 0
    if count > 0:
        print(f"  Prospects already imported ({count} records)")
        return

    if not CSV_PATH.exists():
        print(f"  CSV file not found at {CSV_PATH}")
        return

    # Read CSV
    csv_content = None
    for encoding in ['utf-8', 'latin-1', 'cp1252']:
        try:
            csv_content = CSV_PATH.read_text(encoding=encoding)
            break
        except UnicodeDecodeError:
            continue

    if not csv_content:
        print("  Could not read CSV file")
        return

    reader = csv.DictReader(StringIO(csv_content))
    imported = 0

    for row in reader:
        prospect_id = gen_uuid()

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

        phone = row.get('telephone', '').strip()
        phone = ''.join(c for c in phone if c.isdigit() or c == '+') if phone else None

        await conn.execute(
            text("""
                INSERT INTO plumber_prospects (id, created_at, siren, siret, raison_sociale, nom_dirigeant,
                    prenom_dirigeant, code_ape, forme_juridique, adresse, code_postal, ville, departement,
                    telephone, telephone_2, email, site_web, date_creation, certifications, note_avis,
                    nb_avis, statut, individuel, provenance, sources, date_extraction, source, contact_status)
                VALUES (:id, :created_at, :siren, :siret, :raison_sociale, :nom_dirigeant,
                    :prenom_dirigeant, :code_ape, :forme_juridique, :adresse, :code_postal, :ville, :departement,
                    :telephone, :telephone_2, :email, :site_web, :date_creation, :certifications, :note_avis,
                    :nb_avis, :statut, :individuel, :provenance, :sources, :date_extraction, :source, :contact_status)
            """),
            {
                "id": prospect_id, "created_at": datetime.utcnow(),
                "siren": row.get('siren', '').strip() or None,
                "siret": row.get('siret', '').strip() or None,
                "raison_sociale": row.get('raison_sociale', '').strip() or None,
                "nom_dirigeant": row.get('nom_dirigeant', '').strip() or None,
                "prenom_dirigeant": row.get('prenom_dirigeant', '').strip() or None,
                "code_ape": row.get('code_ape', '').strip() or None,
                "forme_juridique": row.get('forme_juridique', '').strip() or None,
                "adresse": row.get('adresse', '').strip() or None,
                "code_postal": row.get('code_postal', '').strip() or None,
                "ville": row.get('ville', '').strip() or None,
                "departement": row.get('departement', '').strip() or None,
                "telephone": phone,
                "telephone_2": row.get('telephone_2', '').strip() or None,
                "email": row.get('email', '').strip() or None,
                "site_web": row.get('site_web', '').strip() or None,
                "date_creation": row.get('date_creation', '').strip() or None,
                "certifications": row.get('certifications', '').strip() or None,
                "note_avis": note_avis,
                "nb_avis": nb_avis,
                "statut": row.get('statut', '').strip() or None,
                "individuel": individuel,
                "provenance": row.get('provenance', '').strip() or None,
                "sources": row.get('sources', '').strip() or None,
                "date_extraction": row.get('date_extraction', '').strip() or None,
                "source": row.get('source', '').strip() or None,
                "contact_status": "NOT_CONTACTED"
            }
        )
        imported += 1

    print(f"  Imported {imported} prospects from CSV")


# =============================================================================
# Main Migration Function
# =============================================================================

async def migrate():
    """Run the full migration."""
    print("\n" + "=" * 70)
    print("SHATTAF DATABASE MIGRATION: SQLite → PostgreSQL")
    print("=" * 70)

    # Step 1: Export from SQLite
    print("\n[1/5] Exporting data from SQLite...")
    sqlite_data = export_sqlite_data()

    # Step 2: Connect to PostgreSQL and create schema
    print("\n[2/5] Connecting to PostgreSQL and creating schema...")
    engine = create_async_engine(POSTGRES_URL, echo=False)

    try:
        await create_postgres_schema(engine)
    except Exception as e:
        print(f"  Error creating schema: {e}")
        await engine.dispose()
        return

    # Step 3: Import existing data
    print("\n[3/5] Importing existing data...")
    async with engine.begin() as conn:
        # Track existing emails to avoid duplicates
        result = await conn.execute(text("SELECT email FROM users"))
        existing_emails = {row[0] for row in result.fetchall()}

        # Import users (preserving hashed passwords)
        user_id_map = await import_users(conn, sqlite_data.get("users", []), existing_emails)

        # Import profiles
        await import_customer_profiles(conn, sqlite_data.get("customer_profiles", []), user_id_map)
        await import_plumber_profiles(conn, sqlite_data.get("plumber_profiles", []), user_id_map)

        # Import products
        product_id_map = await import_products(conn, sqlite_data.get("products", []))

        # Import prospects (will be re-imported from CSV if empty)
        await import_prospects(conn, sqlite_data.get("plumber_prospects", []))

    # Step 4: Seed comprehensive mock data
    print("\n[4/5] Seeding comprehensive mock data...")
    async with engine.begin() as conn:
        # Get existing emails for deduplication
        result = await conn.execute(text("SELECT email FROM users"))
        existing_emails = {row[0] for row in result.fetchall()}

        # Seed products and pricing
        product_ids = await seed_products(conn)
        await seed_pricing_config(conn)

        # Seed users
        plumbers = await seed_plumbers(conn, existing_emails)
        customers = await seed_customers(conn, existing_emails)

        # Seed workflow data
        await seed_bookings_and_workflow(conn, customers, plumbers, product_ids)

        # Seed support data
        await seed_support_tickets(conn, customers)
        await seed_audit_logs(conn, customers, plumbers)

    # Step 5: Import prospects from CSV
    print("\n[5/5] Importing plumber prospects from CSV...")
    async with engine.begin() as conn:
        await import_csv_prospects(conn)

    # Summary
    print("\n" + "=" * 70)
    print("MIGRATION COMPLETE!")
    print("=" * 70)

    async with engine.connect() as conn:
        tables = [
            ("users", "Users"),
            ("plumber_profiles", "Plumber Profiles"),
            ("customer_profiles", "Customer Profiles"),
            ("products", "Products"),
            ("bookings", "Bookings"),
            ("quotes", "Quotes"),
            ("orders", "Orders"),
            ("jobs", "Jobs"),
            ("invoices", "Invoices"),
            ("mandates", "Mandates"),
            ("support_tickets", "Support Tickets"),
            ("audit_logs", "Audit Logs"),
            ("plumber_prospects", "Plumber Prospects"),
        ]

        print("\nFinal counts:")
        for table, label in tables:
            result = await conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
            count = result.scalar()
            print(f"  {label}: {count}")

        # Plumber distribution
        print("\nPlumber distribution by department:")
        result = await conn.execute(
            text("SELECT department, COUNT(*) FROM plumber_profiles GROUP BY department ORDER BY department")
        )
        for row in result.fetchall():
            print(f"  {row[0]}: {row[1]}")

    await engine.dispose()

    print(f"""
Test credentials (preserved from SQLite):
  - admin@test.com / admin123
  - plumber@test.com / plumber123
  - customer@test.com / customer123

Next steps:
  1. Update apps/api/.env: DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/shattaf
  2. Start API: cd apps/api && uvicorn src.main:app --reload
  3. Test: http://localhost:8010/docs
""")


if __name__ == "__main__":
    asyncio.run(migrate())
