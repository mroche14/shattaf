"""Database configuration and session management."""

import os
from pathlib import Path
from typing import AsyncGenerator
from sqlalchemy import text, func
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel, select

from .config import get_settings

settings = get_settings()


def get_database_url() -> str:
    """Get database URL, falling back to SQLite if PostgreSQL is unavailable."""
    if settings.USE_SQLITE_FALLBACK:
        # Try PostgreSQL first, but prepare SQLite fallback
        try:
            import asyncpg
            # We'll test the connection in init_db
            return settings.DATABASE_URL
        except ImportError:
            pass

    # Check if we should use SQLite
    if settings.DATABASE_URL.startswith("sqlite") or settings.USE_SQLITE_FALLBACK:
        # Create data directory
        data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
        os.makedirs(data_dir, exist_ok=True)
        sqlite_path = os.path.join(data_dir, "shattaf_dev.db")
        return f"sqlite+aiosqlite:///{sqlite_path}"

    return settings.DATABASE_URL


# Database URL - will be set after testing connection
_database_url = settings.DATABASE_URL
_using_sqlite = False

# Create async engine (lazy initialization)
engine = None
async_session_factory = None


async def _create_engine(url: str, echo: bool = False):
    """Create an async engine."""
    connect_args = {}
    if url.startswith("sqlite"):
        connect_args["check_same_thread"] = False

    return create_async_engine(
        url,
        echo=echo,
        future=True,
        connect_args=connect_args if url.startswith("sqlite") else {},
    )


async def init_db() -> None:
    """Initialize database tables."""
    global engine, async_session_factory, _database_url, _using_sqlite

    db_url = settings.DATABASE_URL

    # Ensure data directory exists for SQLite
    if db_url.startswith("sqlite"):
        data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
        os.makedirs(data_dir, exist_ok=True)
        # If relative path, make it absolute
        if ":///" in db_url and not db_url.split(":///")[1].startswith("/"):
            sqlite_path = os.path.join(data_dir, os.path.basename(db_url.split(":///")[1]))
            db_url = f"sqlite+aiosqlite:///{sqlite_path}"
        print(f"✓ Using SQLite: {db_url.split(':///')[-1]}")

    engine = await _create_engine(db_url, echo=settings.DEBUG)
    _database_url = db_url
    _using_sqlite = db_url.startswith("sqlite")

    # Create session factory
    async_session_factory = sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    # Import all models to ensure they're registered with SQLModel metadata
    from . import models  # noqa: F401

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    print("✓ Database tables initialized")

    # Seed test users if needed
    await _seed_test_users()

    # Seed mock data (products, bookings, orders, jobs, etc.)
    await _seed_mock_data()

    # Auto-import prospects if table is empty
    await _auto_import_prospects()


async def _seed_test_users() -> None:
    """Seed test users if they don't exist."""
    from passlib.context import CryptContext
    from uuid import uuid4
    from datetime import datetime

    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    # Check if users exist
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT COUNT(*) FROM users"))
        count = result.scalar() or 0
        if count > 0:
            print(f"✓ Users already exist ({count} records)")
            return

    # Create test users (role values must match UserRole enum: CUSTOMER, PLUMBER, ADMIN)
    test_users = [
        {
            "email": "admin@test.com",
            "phone": "0690000001",
            "first_name": "Admin",
            "last_name": "Test",
            "role": "ADMIN",
            "password": "admin123",
        },
        {
            "email": "plumber@test.com",
            "phone": "0690000002",
            "first_name": "Jean",
            "last_name": "Plombier",
            "role": "PLUMBER",
            "password": "plumber123",
        },
        {
            "email": "customer@test.com",
            "phone": "0690000003",
            "first_name": "Marie",
            "last_name": "Client",
            "role": "CUSTOMER",
            "password": "customer123",
        },
    ]

    try:
        async with engine.begin() as conn:
            for user_data in test_users:
                user_id = str(uuid4())
                now = datetime.utcnow()
                hashed_pw = pwd_context.hash(user_data["password"])

                # Insert user
                await conn.execute(
                    text("""
                        INSERT INTO users (id, created_at, email, phone, hashed_password, first_name, last_name, role, is_active, is_verified)
                        VALUES (:id, :created_at, :email, :phone, :hashed_password, :first_name, :last_name, :role, true, true)
                    """),
                    {
                        "id": user_id,
                        "created_at": now,
                        "email": user_data["email"],
                        "phone": user_data["phone"],
                        "hashed_password": hashed_pw,
                        "first_name": user_data["first_name"],
                        "last_name": user_data["last_name"],
                        "role": user_data["role"],
                    }
                )

                # Create profile based on role
                profile_id = str(uuid4())
                if user_data["role"] == "PLUMBER":
                    await conn.execute(
                        text("""
                            INSERT INTO plumber_profiles (id, created_at, user_id, status, service_area_radius_km, total_jobs_completed, total_ratings, stripe_onboarding_complete, stripe_charges_enabled, stripe_payouts_enabled, mandate_signed)
                            VALUES (:id, :created_at, :user_id, 'ACTIVE', 30.0, 0, 0, false, false, false, false)
                        """),
                        {"id": profile_id, "created_at": now, "user_id": user_id}
                    )
                elif user_data["role"] == "CUSTOMER":
                    await conn.execute(
                        text("""
                            INSERT INTO customer_profiles (id, created_at, user_id, address_country)
                            VALUES (:id, :created_at, :user_id, 'FR')
                        """),
                        {"id": profile_id, "created_at": now, "user_id": user_id}
                    )

        print("✓ Seeded 3 test users (admin@test.com, plumber@test.com, customer@test.com) - password: [role]123")
    except Exception as e:
        print(f"⚠ Failed to seed users: {e}")


async def _seed_mock_data() -> None:
    """Seed comprehensive mock data for development."""
    from uuid import uuid4
    from datetime import datetime, timedelta, date
    from passlib.context import CryptContext
    import random
    import json

    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    now = datetime.utcnow()

    # Check if products already exist
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT COUNT(*) FROM products"))
        if (result.scalar() or 0) > 0:
            print("✓ Mock data already exists")
            return

    try:
        async with engine.begin() as conn:
            # ==================== PRODUCTS ====================
            products = [
                {
                    "id": str(uuid4()),
                    "created_at": now,
                    "sku": "SHATTAF-CLASSIC",
                    "name": "Shattaf Classic",
                    "description": "Douchette WC classique avec flexible inox et support mural. Installation facile.",
                    "category": "SHATTAF",
                    "supplier_price": 1500,
                    "price_b2c": 4900,
                    "price_b2b": 3900,
                    "vat_rate": "8.5",
                    "stock_quantity": 150,
                    "is_available": True,
                    "image_url": "https://placehold.co/400x400/06b6d4/white?text=Classic",
                    "gallery_urls": "[]",
                    "specifications": json.dumps({"material": "ABS + Inox", "length": "1.2m", "pressure": "0.5-8 bar"}),
                    "weight_grams": 450,
                    "requires_installation": True,
                    "installation_time_minutes": 30,
                    "installation_price": 5000,
                },
                {
                    "id": str(uuid4()),
                    "created_at": now,
                    "sku": "SHATTAF-PREMIUM",
                    "name": "Shattaf Premium",
                    "description": "Douchette WC premium tout métal avec double jet et finition chromée.",
                    "category": "SHATTAF",
                    "supplier_price": 2500,
                    "price_b2c": 7900,
                    "price_b2b": 6500,
                    "vat_rate": "8.5",
                    "stock_quantity": 75,
                    "is_available": True,
                    "image_url": "https://placehold.co/400x400/8b5cf6/white?text=Premium",
                    "gallery_urls": "[]",
                    "specifications": json.dumps({"material": "Laiton chromé", "length": "1.5m", "pressure": "0.5-10 bar", "jets": 2}),
                    "weight_grams": 680,
                    "requires_installation": True,
                    "installation_time_minutes": 45,
                    "installation_price": 5500,
                },
                {
                    "id": str(uuid4()),
                    "created_at": now,
                    "sku": "SHATTAF-ECO",
                    "name": "Shattaf Eco",
                    "description": "Douchette WC économique pour petit budget. Qualité correcte.",
                    "category": "SHATTAF",
                    "supplier_price": 800,
                    "price_b2c": 2900,
                    "price_b2b": 2400,
                    "vat_rate": "8.5",
                    "stock_quantity": 200,
                    "is_available": True,
                    "image_url": "https://placehold.co/400x400/10b981/white?text=Eco",
                    "gallery_urls": "[]",
                    "specifications": json.dumps({"material": "ABS", "length": "1.0m", "pressure": "0.5-6 bar"}),
                    "weight_grams": 320,
                    "requires_installation": True,
                    "installation_time_minutes": 25,
                    "installation_price": 4500,
                },
                {
                    "id": str(uuid4()),
                    "created_at": now,
                    "sku": "KIT-RACCORD",
                    "name": "Kit Raccordement Universel",
                    "description": "Kit de raccordement avec té de dérivation et joints. Compatible tous WC.",
                    "category": "KIT",
                    "supplier_price": 500,
                    "price_b2c": 1500,
                    "price_b2b": 1200,
                    "vat_rate": "8.5",
                    "stock_quantity": 300,
                    "is_available": True,
                    "image_url": "https://placehold.co/400x400/f59e0b/white?text=Kit",
                    "gallery_urls": "[]",
                    "specifications": json.dumps({"includes": ["Té 3/8", "Flexible", "Joints", "Téflon"]}),
                    "weight_grams": 180,
                    "requires_installation": False,
                    "installation_time_minutes": 0,
                    "installation_price": 0,
                },
                {
                    "id": str(uuid4()),
                    "created_at": now,
                    "sku": "ACC-SUPPORT-MURAL",
                    "name": "Support Mural Inox",
                    "description": "Support mural en inox pour douchette WC. Fixation solide.",
                    "category": "ACCESSORY",
                    "supplier_price": 300,
                    "price_b2c": 990,
                    "price_b2b": 800,
                    "vat_rate": "8.5",
                    "stock_quantity": 250,
                    "is_available": True,
                    "image_url": "https://placehold.co/400x400/64748b/white?text=Support",
                    "gallery_urls": "[]",
                    "specifications": json.dumps({"material": "Inox 304", "fixation": "Vis + chevilles"}),
                    "weight_grams": 85,
                    "requires_installation": False,
                    "installation_time_minutes": 0,
                    "installation_price": 0,
                },
            ]

            for p in products:
                await conn.execute(
                    text("""
                        INSERT INTO products (id, created_at, sku, name, description, category, supplier_price, price_b2c, price_b2b, vat_rate, stock_quantity, is_available, image_url, gallery_urls, specifications, weight_grams, requires_installation, installation_time_minutes, installation_price)
                        VALUES (:id, :created_at, :sku, :name, :description, :category, :supplier_price, :price_b2c, :price_b2b, :vat_rate, :stock_quantity, :is_available, :image_url, :gallery_urls, :specifications, :weight_grams, :requires_installation, :installation_time_minutes, :installation_price)
                    """),
                    p
                )

            product_ids = [p["id"] for p in products[:3]]  # Only shattaf products
            print(f"✓ Seeded {len(products)} products")

            # ==================== PRICING CONFIG ====================
            pricing_id = str(uuid4())
            await conn.execute(
                text("""
                    INSERT INTO pricing_config (id, created_at, name, plumber_travel_fee, plumber_labor_fee, commission_first_unit, commission_additional, b2b_discount_percent, notes)
                    VALUES (:id, :created_at, 'default', 2000, 5000, 4000, 1000, 15, 'Configuration par défaut DOM-TOM')
                """),
                {"id": pricing_id, "created_at": now}
            )
            print("✓ Seeded pricing config")

            # ==================== ADDITIONAL USERS ====================
            # Locations in DOM-TOM
            locations = {
                "971": [  # Guadeloupe
                    {"city": "Pointe-à-Pitre", "postal": "97110", "lat": 16.2411, "lng": -61.5331},
                    {"city": "Les Abymes", "postal": "97139", "lat": 16.2690, "lng": -61.5048},
                    {"city": "Baie-Mahault", "postal": "97122", "lat": 16.2674, "lng": -61.5853},
                    {"city": "Le Gosier", "postal": "97190", "lat": 16.2142, "lng": -61.4936},
                    {"city": "Sainte-Anne", "postal": "97180", "lat": 16.2272, "lng": -61.3833},
                ],
                "972": [  # Martinique
                    {"city": "Fort-de-France", "postal": "97200", "lat": 14.6161, "lng": -61.0588},
                    {"city": "Le Lamentin", "postal": "97232", "lat": 14.6118, "lng": -60.9963},
                    {"city": "Schoelcher", "postal": "97233", "lat": 14.6147, "lng": -61.0908},
                    {"city": "Sainte-Marie", "postal": "97230", "lat": 14.7833, "lng": -61.0167},
                ],
                "973": [  # Guyane
                    {"city": "Cayenne", "postal": "97300", "lat": 4.9372, "lng": -52.3260},
                    {"city": "Kourou", "postal": "97310", "lat": 5.1561, "lng": -52.6500},
                    {"city": "Saint-Laurent-du-Maroni", "postal": "97320", "lat": 5.5000, "lng": -54.0333},
                ],
            }

            # Create plumbers
            plumber_data = [
                # DOM-TOM — Guadeloupe (971)
                ("Pierre", "Martin", "pierre.martin@plombier.gp", "0690100001", "971", "Plomberie Martin SARL", "123456789"),
                ("Jacques", "Durand", "jacques.durand@plombier.gp", "0690100002", "971", "Durand & Fils", "234567890"),
                ("Éric", "Larcher", "eric.larcher@plombier.gp", "0690100003", "971", "Larcher Plomberie", "345012789"),
                ("Claude", "Neisson", "claude.neisson@plombier.gp", "0690100004", "971", "Neisson Services", "456012890"),
                ("Thierry", "Guérin", "thierry.guerin@plombier.gp", "0690100005", "971", "Guérin & Fils", "567012901"),
                # DOM-TOM — Martinique (972)
                ("Marc", "Bernard", "marc.bernard@plombier.mq", "0696200001", "972", "MB Plomberie", "345678901"),
                ("Paul", "Petit", "paul.petit@plombier.mq", "0696200002", "972", "Petit Plomberie", "456789012"),
                ("Fabrice", "Césaire", "fabrice.cesaire@plombier.mq", "0696200003", "972", "Césaire Plomberie", "567890234"),
                ("Olivier", "Glissant", "olivier.glissant@plombier.mq", "0696200004", "972", "Glissant Services", "678901345"),
                # DOM-TOM — Guyane (973)
                ("André", "Robert", "andre.robert@plombier.gf", "0694300001", "973", "Robert Services", "567890123"),
                ("René", "Atipa", "rene.atipa@plombier.gf", "0694300002", "973", "Atipa Plomberie", "678901234"),
                ("Daniel", "Taubira", "daniel.taubira@plombier.gf", "0694300003", "973", "Taubira & Fils", "789012345"),
            ]

            plumber_ids = []
            customer_ids = []

            # Track index per department so each plumber gets a distinct location
            dept_loc_index: dict[str, int] = {}

            for first, last, email, phone, dept, company, siren in plumber_data:
                user_id = str(uuid4())
                plumber_ids.append(user_id)
                idx = dept_loc_index.get(dept, 0)
                loc = locations[dept][idx % len(locations[dept])]
                dept_loc_index[dept] = idx + 1

                await conn.execute(
                    text("""
                        INSERT INTO users (id, created_at, email, phone, hashed_password, first_name, last_name, role, is_active, is_verified)
                        VALUES (:id, :created_at, :email, :phone, :hashed_password, :first_name, :last_name, 'PLUMBER', true, true)
                    """),
                    {
                        "id": user_id,
                        "created_at": now,
                        "email": email,
                        "phone": phone,
                        "hashed_password": pwd_context.hash("plumber123"),
                        "first_name": first,
                        "last_name": last,
                    }
                )

                profile_id = str(uuid4())
                intervention_locs = json.dumps([{"lat": loc["lat"], "lng": loc["lng"], "address": f"{loc['city']}, {loc['postal']}", "label": "Base"}])
                await conn.execute(
                    text("""
                        INSERT INTO plumber_profiles (id, created_at, user_id, status, department, intervention_locations, company_name, siren, service_area_lat, service_area_lng, service_area_radius_km, total_jobs_completed, average_rating, total_ratings, stripe_onboarding_complete, stripe_charges_enabled, stripe_payouts_enabled, mandate_signed)
                        VALUES (:id, :created_at, :user_id, 'ACTIVE', :department, :intervention_locations, :company_name, :siren, :lat, :lng, :radius, :jobs, :rating, :ratings, true, true, true, true)
                    """),
                    {
                        "id": profile_id,
                        "created_at": now,
                        "user_id": user_id,
                        "department": dept,
                        "intervention_locations": intervention_locs,
                        "company_name": company,
                        "siren": siren,
                        "lat": loc["lat"],
                        "lng": loc["lng"],
                        "radius": random.choice([8, 10, 12, 15, 20]),
                        "jobs": random.randint(10, 50),
                        "rating": round(random.uniform(4.0, 5.0), 1),
                        "ratings": random.randint(5, 30),
                    }
                )

            print(f"✓ Seeded {len(plumber_data)} plumbers with profiles")

            # Create customers
            customer_data = [
                ("Sophie", "Lefebvre", "sophie.lefebvre@email.gp", "0690200001", "971"),
                ("Julie", "Moreau", "julie.moreau@email.gp", "0690200002", "971"),
                ("Emma", "Garcia", "emma.garcia@email.gp", "0690200003", "971"),
                ("Lucas", "Roux", "lucas.roux@email.mq", "0696300001", "972"),
                ("Thomas", "Fournier", "thomas.fournier@email.mq", "0696300002", "972"),
                ("Camille", "Girard", "camille.girard@email.gf", "0694400001", "973"),
            ]

            for first, last, email, phone, dept in customer_data:
                user_id = str(uuid4())
                customer_ids.append(user_id)
                loc = random.choice(locations[dept])

                await conn.execute(
                    text("""
                        INSERT INTO users (id, created_at, email, phone, hashed_password, first_name, last_name, role, is_active, is_verified)
                        VALUES (:id, :created_at, :email, :phone, :hashed_password, :first_name, :last_name, 'CUSTOMER', true, true)
                    """),
                    {
                        "id": user_id,
                        "created_at": now,
                        "email": email,
                        "phone": phone,
                        "hashed_password": pwd_context.hash("customer123"),
                        "first_name": first,
                        "last_name": last,
                    }
                )

                profile_id = str(uuid4())
                await conn.execute(
                    text("""
                        INSERT INTO customer_profiles (id, created_at, user_id, address_street, address_city, address_postal_code, address_country, address_lat, address_lng)
                        VALUES (:id, :created_at, :user_id, :street, :city, :postal, 'Guadeloupe', :lat, :lng)
                    """),
                    {
                        "id": profile_id,
                        "created_at": now,
                        "user_id": user_id,
                        "street": f"{random.randint(1, 100)} Rue de la République",
                        "city": loc["city"],
                        "postal": loc["postal"],
                        "lat": loc["lat"] + random.uniform(-0.01, 0.01),
                        "lng": loc["lng"] + random.uniform(-0.01, 0.01),
                    }
                )

            print(f"✓ Seeded {len(customer_data)} customers with profiles")

            # ==================== BOOKINGS, QUOTES, ORDERS, JOBS ====================
            booking_ids = []
            quote_ids = []
            order_ids = []

            # Create various bookings at different statuses
            booking_statuses = ["SUBMITTED", "QUOTED", "ACCEPTED", "ACCEPTED", "ACCEPTED"]

            for i, status in enumerate(booking_statuses):
                booking_id = str(uuid4())
                booking_ids.append(booking_id)
                cust_id = customer_ids[i % len(customer_ids)]
                plumb_id = plumber_ids[i % len(plumber_ids)]
                prod_id = product_ids[i % len(product_ids)]
                dept = ["971", "971", "972", "972", "973"][i]
                loc = random.choice(locations[dept])

                await conn.execute(
                    text("""
                        INSERT INTO bookings (id, created_at, customer_id, status, address_street, address_city, address_postal_code, address_country, address_lat, address_lng, toilet_type, shutoff_valve_accessible, parking_available, product_id, preferred_date, assigned_plumber_id, additional_photo_urls)
                        VALUES (:id, :created_at, :customer_id, :status, :street, :city, :postal, 'Guadeloupe', :lat, :lng, 'STANDARD', true, true, :product_id, :pref_date, :plumber_id, '[]')
                    """),
                    {
                        "id": booking_id,
                        "created_at": (now - timedelta(days=10-i)),
                        "customer_id": cust_id,
                        "status": status,
                        "street": f"{random.randint(1, 150)} Avenue des Palmiers",
                        "city": loc["city"],
                        "postal": loc["postal"],
                        "lat": loc["lat"],
                        "lng": loc["lng"],
                        "product_id": prod_id,
                        "pref_date": (now + timedelta(days=i+1)),
                        "plumber_id": plumb_id if status != "SUBMITTED" else None,
                    }
                )

                # Create quotes for QUOTED and ACCEPTED bookings
                if status in ["QUOTED", "ACCEPTED"]:
                    quote_id = str(uuid4())
                    quote_ids.append(quote_id)
                    install_price = 5000
                    product_price = products[i % 3]["price_b2c"]
                    platform_fee = 4000
                    total = install_price + product_price + platform_fee

                    await conn.execute(
                        text("""
                            INSERT INTO quotes (id, created_at, booking_id, plumber_id, status, installation_price, product_price, platform_fee, total_price, vat_amount, price_excluding_vat, proposed_date, proposed_time_slot, estimated_duration_minutes, valid_until)
                            VALUES (:id, :created_at, :booking_id, :plumber_id, :status, :install, :product, :fee, :total, :vat, :excl_vat, :prop_date, 'morning', 45, :valid)
                        """),
                        {
                            "id": quote_id,
                            "created_at": (now - timedelta(days=8-i)),
                            "booking_id": booking_id,
                            "plumber_id": plumb_id,
                            "status": "ACCEPTED" if status == "ACCEPTED" else "PENDING",
                            "install": install_price,
                            "product": product_price,
                            "fee": platform_fee,
                            "total": total,
                            "vat": int(total * 0.085),
                            "excl_vat": int(total / 1.085),
                            "prop_date": (now + timedelta(days=i+1)),
                            "valid": (now + timedelta(days=3)),
                        }
                    )

                    # Create orders for ACCEPTED quotes
                    if status == "ACCEPTED":
                        order_id = str(uuid4())
                        order_ids.append(order_id)
                        order_num = f"ORD-{2024}{str(i+1).zfill(4)}"

                        await conn.execute(
                            text("""
                                INSERT INTO orders (id, created_at, order_number, customer_id, plumber_id, booking_id, quote_id, status, payment_status, product_subtotal, installation_subtotal, platform_fee, vat_amount, total_amount, scheduled_date, scheduled_time_slot)
                                VALUES (:id, :created_at, :order_num, :cust_id, :plumb_id, :book_id, :quote_id, :status, :pay_status, :prod_sub, :inst_sub, :fee, :vat, :total, :sched_date, 'morning')
                            """),
                            {
                                "id": order_id,
                                "created_at": (now - timedelta(days=5-i)),
                                "order_num": order_num,
                                "cust_id": cust_id,
                                "plumb_id": plumb_id,
                                "book_id": booking_id,
                                "quote_id": quote_id,
                                "status": ["SCHEDULED", "IN_PROGRESS", "COMPLETED"][i % 3],
                                "pay_status": "CAPTURED",
                                "prod_sub": product_price,
                                "inst_sub": install_price,
                                "fee": platform_fee,
                                "vat": int(total * 0.085),
                                "total": total,
                                "sched_date": (now + timedelta(days=i-2)),
                            }
                        )

                        # Create jobs for orders
                        job_id = str(uuid4())
                        job_statuses = ["SCHEDULED", "IN_PROGRESS", "COMPLETED"]
                        job_status = job_statuses[i % 3]

                        await conn.execute(
                            text("""
                                INSERT INTO jobs (id, created_at, order_id, plumber_id, status, scheduled_date, photo_before_urls, photo_after_urls, signature_name, inventory_qr_scanned)
                                VALUES (:id, :created_at, :order_id, :plumber_id, :status, :sched_date, '[]', '[]', :sig_name, false)
                            """),
                            {
                                "id": job_id,
                                "created_at": (now - timedelta(days=3-i)),
                                "order_id": order_id,
                                "plumber_id": plumb_id,
                                "status": job_status,
                                "sched_date": (now + timedelta(days=i-2)),
                                "sig_name": "" if job_status != "COMPLETED" else customer_data[i % len(customer_data)][0] + " " + customer_data[i % len(customer_data)][1],
                            }
                        )

                        # Create invoice for completed orders
                        if job_status == "COMPLETED":
                            inv_id = str(uuid4())
                            inv_num = f"INV-{2024}{str(i+1).zfill(4)}"
                            plumb_info = plumber_data[i % len(plumber_data)]
                            cust_info = customer_data[i % len(customer_data)]

                            await conn.execute(
                                text("""
                                    INSERT INTO invoices (id, created_at, invoice_number, order_id, status, issuer_name, issuer_siren, issuer_address, customer_id, customer_name, customer_address, customer_email, plumber_id, plumber_name, plumber_siren, invoice_date, due_date, subtotal_products, subtotal_installation, vat_products, vat_installation, total_excluding_vat, total_vat, total_amount, vat_rate, mandate_mention)
                                    VALUES (:id, :created_at, :inv_num, :order_id, 'ISSUED', 'Oasis Shattaf', '123456789', 'Guadeloupe, France', :cust_id, :cust_name, :cust_addr, :cust_email, :plumb_id, :plumb_name, :plumb_siren, :inv_date, :due_date, :prod_sub, :inst_sub, :vat_prod, :vat_inst, :excl_vat, :total_vat, :total, '8.5', 'Facture émise par Oasis Shattaf en qualité de mandataire.')
                                """),
                                {
                                    "id": inv_id,
                                    "created_at": now,
                                    "inv_num": inv_num,
                                    "order_id": order_id,
                                    "cust_id": cust_id,
                                    "cust_name": f"{cust_info[0]} {cust_info[1]}",
                                    "cust_addr": f"{loc['city']}, {loc['postal']}",
                                    "cust_email": cust_info[2],
                                    "plumb_id": plumb_id,
                                    "plumb_name": plumb_info[4],
                                    "plumb_siren": plumb_info[6],
                                    "inv_date": date.today(),
                                    "due_date": (date.today() + timedelta(days=30)),
                                    "prod_sub": product_price,
                                    "inst_sub": install_price,
                                    "vat_prod": int(product_price * 0.085),
                                    "vat_inst": int(install_price * 0.085),
                                    "excl_vat": int(total / 1.085),
                                    "total_vat": int(total * 0.085),
                                    "total": total,
                                }
                            )

            print(f"✓ Seeded {len(booking_ids)} bookings, {len(quote_ids)} quotes, {len(order_ids)} orders with jobs")

        print("✓ Mock data seeding complete!")

    except Exception as e:
        print(f"⚠ Failed to seed mock data: {e}")
        import traceback
        traceback.print_exc()


async def _auto_import_prospects() -> None:
    """Auto-import prospects from CSV if table is empty."""
    import csv
    from io import StringIO
    from uuid import uuid4
    from datetime import datetime

    # Find the CSV file (relative to the api directory)
    api_dir = Path(__file__).parent.parent
    csv_paths = [
        api_dir.parent.parent / "extractions-plombier" / "processed" / "plombiers_final.csv",
        api_dir / "data" / "plombiers_final.csv",
    ]

    csv_path = None
    for path in csv_paths:
        if path.exists():
            csv_path = path
            break

    if not csv_path:
        return  # No CSV file found, skip auto-import

    # Check if table is empty using raw connection
    async with engine.connect() as conn:
        try:
            result = await conn.execute(text("SELECT COUNT(*) FROM plumber_prospects"))
            count = result.scalar() or 0
            if count > 0:
                # Check if any need geocoding
                ungeo = await conn.execute(text(
                    "SELECT COUNT(*) FROM plumber_prospects "
                    "WHERE geocoded_at IS NULL AND ville IS NOT NULL"
                ))
                pending = ungeo.scalar() or 0
                if pending > 0:
                    print(f"✓ Prospects already loaded ({count} records, {pending} need geocoding)")
                    await _geocode_all_prospects()
                else:
                    print(f"✓ Prospects already loaded ({count} records, all geocoded)")
                return
        except Exception:
            pass  # Table might not exist yet, continue

    # Read CSV file
    csv_content = None
    for encoding in ['utf-8', 'latin-1', 'cp1252']:
        try:
            csv_content = csv_path.read_text(encoding=encoding)
            break
        except UnicodeDecodeError:
            continue

    if not csv_content:
        return

    # Import using raw SQL
    try:
        reader = csv.DictReader(StringIO(csv_content))
        rows_to_insert = []

        for row in reader:
            individuel = None
            if row.get('individuel'):
                individuel = True if row['individuel'].upper() in ('OUI', 'TRUE', '1', 'YES') else False

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

            # Normalize phone
            phone = row.get('telephone', '').strip()
            phone = ''.join(c for c in phone if c.isdigit() or c == '+') if phone else None

            rows_to_insert.append({
                'id': str(uuid4()),
                'created_at': datetime.utcnow(),
                'siren': row.get('siren', '').strip() or None,
                'siret': row.get('siret', '').strip() or None,
                'raison_sociale': row.get('raison_sociale', '').strip() or None,
                'nom_dirigeant': row.get('nom_dirigeant', '').strip() or None,
                'prenom_dirigeant': row.get('prenom_dirigeant', '').strip() or None,
                'code_ape': row.get('code_ape', '').strip() or None,
                'forme_juridique': row.get('forme_juridique', '').strip() or None,
                'adresse': row.get('adresse', '').strip() or None,
                'code_postal': row.get('code_postal', '').strip() or None,
                'ville': row.get('ville', '').strip() or None,
                'departement': row.get('departement', '').strip() or None,
                'telephone': phone,
                'telephone_2': row.get('telephone_2', '').strip() or None,
                'email': row.get('email', '').strip() or None,
                'site_web': row.get('site_web', '').strip() or None,
                'date_creation': row.get('date_creation', '').strip() or None,
                'certifications': row.get('certifications', '').strip() or None,
                'note_avis': note_avis,
                'nb_avis': nb_avis,
                'statut': row.get('statut', '').strip() or None,
                'individuel': individuel,
                'provenance': row.get('provenance', '').strip() or None,
                'sources': row.get('sources', '').strip() or None,
                'date_extraction': row.get('date_extraction', '').strip() or None,
                'source': row.get('source', '').strip() or None,
                'contact_status': 'NOT_CONTACTED',
            })

        # Batch insert using raw SQL
        if rows_to_insert:
            async with engine.begin() as conn:
                await conn.execute(
                    text("""
                        INSERT INTO plumber_prospects (
                            id, created_at, siren, siret, raison_sociale, nom_dirigeant,
                            prenom_dirigeant, code_ape, forme_juridique, adresse, code_postal,
                            ville, departement, telephone, telephone_2, email, site_web,
                            date_creation, certifications, note_avis, nb_avis, statut,
                            individuel, provenance, sources, date_extraction, source, contact_status
                        ) VALUES (
                            :id, :created_at, :siren, :siret, :raison_sociale, :nom_dirigeant,
                            :prenom_dirigeant, :code_ape, :forme_juridique, :adresse, :code_postal,
                            :ville, :departement, :telephone, :telephone_2, :email, :site_web,
                            :date_creation, :certifications, :note_avis, :nb_avis, :statut,
                            :individuel, :provenance, :sources, :date_extraction, :source, :contact_status
                        )
                    """),
                    rows_to_insert
                )
            print(f"✓ Auto-imported {len(rows_to_insert)} prospects from {csv_path.name}")

            # Geocode all imported prospects so they appear on the map immediately
            await _geocode_all_prospects()

    except Exception as e:
        print(f"⚠ Failed to auto-import prospects: {e}")


async def _geocode_all_prospects() -> None:
    """Geocode all un-geocoded prospects using the BAN API.

    Runs synchronously during startup so the map is immediately populated.
    """
    from .models.prospect import PlumberProspect
    from .services.geocoding import GeocodingService

    try:
        async with async_session_factory() as session:
            result = await session.execute(
                select(PlumberProspect).where(
                    PlumberProspect.geocoded_at.is_(None),
                    PlumberProspect.ville.is_not(None),
                )
            )
            prospects = list(result.scalars().all())

            if not prospects:
                return

            print(f"  Geocoding {len(prospects)} prospects via BAN API...", flush=True)
            geocoding_service = GeocodingService(session)
            stats = await geocoding_service.geocode_prospects(prospects)
            print(f"✓ Geocoding complete: {stats['geocoded']} geocoded, {stats['failed']} failed, {stats['skipped']} skipped", flush=True)

    except Exception as e:
        print(f"⚠ Geocoding failed (prospects will be geocoded on first map request): {e}")


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Get database session for dependency injection."""
    if async_session_factory is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")

    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def close_db() -> None:
    """Close database connections."""
    global engine
    if engine:
        await engine.dispose()
