"""Seed database with products, users, and fake data."""

import asyncio
from datetime import datetime, timedelta
from decimal import Decimal
import random

# Add parent directory to path
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.database import init_db
import src.database as db_module
from src.models import (
    Product, ProductCategory, PricingConfig, User, UserRole,
    Booking, BookingStatus, ToiletType, Quote, QuoteStatus,
    PlumberProfile, PlumberStatus, Job, JobStatus,
    Order, OrderStatus, PaymentStatus
)
from src.models.plumber import Department
from src.services.auth import AuthService


# =============================================================================
# NAME GENERATORS
# =============================================================================

FIRST_NAMES = [
    "Jean", "Pierre", "Michel", "André", "Philippe", "Alain", "Bernard", "Jacques",
    "Marcel", "René", "Claude", "Robert", "Louis", "Henri", "Paul", "Roger",
    "François", "Gérard", "Daniel", "Yves", "Christian", "Maurice", "Patrick",
    "Thierry", "Serge", "Laurent", "Eric", "Didier", "Dominique", "Christophe",
    "Marie", "Jeanne", "Françoise", "Monique", "Catherine", "Nathalie", "Isabelle",
    "Sylvie", "Christine", "Martine", "Sophie", "Sandrine", "Valérie", "Céline",
    "Stéphanie", "Véronique", "Karine", "Corinne", "Laurence", "Pascale"
]

LAST_NAMES = [
    "Martin", "Bernard", "Thomas", "Petit", "Robert", "Richard", "Durand", "Dubois",
    "Moreau", "Laurent", "Simon", "Michel", "Lefebvre", "Leroy", "Roux", "David",
    "Bertrand", "Morel", "Fournier", "Girard", "Bonnet", "Dupont", "Lambert", "Fontaine",
    "Rousseau", "Vincent", "Muller", "Lefevre", "Faure", "Andre", "Mercier", "Blanc",
    "Guerin", "Boyer", "Garnier", "Chevalier", "Francois", "Legrand", "Gauthier", "Garcia",
    "Perrin", "Robin", "Clement", "Morin", "Nicolas", "Henry", "Roussel", "Mathieu"
]

CITIES = [
    {"name": "Pointe-à-Pitre", "postal": "97110", "lat": 16.2411, "lng": -61.5331},
    {"name": "Les Abymes", "postal": "97139", "lat": 16.2706, "lng": -61.5044},
    {"name": "Baie-Mahault", "postal": "97122", "lat": 16.2675, "lng": -61.5853},
    {"name": "Le Gosier", "postal": "97190", "lat": 16.2167, "lng": -61.4833},
    {"name": "Sainte-Anne", "postal": "97180", "lat": 16.2272, "lng": -61.3592},
    {"name": "Saint-François", "postal": "97118", "lat": 16.2500, "lng": -61.2667},
    {"name": "Petit-Bourg", "postal": "97170", "lat": 16.1833, "lng": -61.5833},
    {"name": "Capesterre-Belle-Eau", "postal": "97130", "lat": 16.0500, "lng": -61.5667},
    {"name": "Basse-Terre", "postal": "97100", "lat": 15.9958, "lng": -61.7292},
    {"name": "Lamentin", "postal": "97129", "lat": 16.2667, "lng": -61.6333},
    {"name": "Morne-à-l'Eau", "postal": "97111", "lat": 16.3333, "lng": -61.4500},
    {"name": "Sainte-Rose", "postal": "97115", "lat": 16.3333, "lng": -61.7000},
    {"name": "Goyave", "postal": "97128", "lat": 16.1333, "lng": -61.5833},
    {"name": "Trois-Rivières", "postal": "97114", "lat": 15.9833, "lng": -61.6500},
    {"name": "Port-Louis", "postal": "97117", "lat": 16.4167, "lng": -61.5333},
]

STREET_TYPES = ["Rue", "Avenue", "Boulevard", "Chemin", "Impasse", "Allée"]
STREET_NAMES = [
    "de la République", "des Palmiers", "Victor Hugo", "de la Liberté", "des Cocotiers",
    "de l'Europe", "Général de Gaulle", "des Flamboyants", "de la Marina", "des Caraïbes",
    "du Commerce", "de la Plage", "du Port", "des Alizés", "de Verdun", "Jean Jaurès",
    "Schoelcher", "de la Gare", "de l'Église", "du Marché"
]


def generate_address():
    city = random.choice(CITIES)
    street_num = random.randint(1, 150)
    street_type = random.choice(STREET_TYPES)
    street_name = random.choice(STREET_NAMES)
    return {
        "street": f"{street_num} {street_type} {street_name}",
        "city": city["name"],
        "postal": city["postal"],
        "lat": city["lat"] + random.uniform(-0.02, 0.02),
        "lng": city["lng"] + random.uniform(-0.02, 0.02),
    }


_used_phones = set()

def generate_phone(prefix="0690"):
    """Generate a unique phone number."""
    while True:
        phone = f"+590{prefix}{random.randint(100000, 999999)}"
        if phone not in _used_phones:
            _used_phones.add(phone)
            return phone


# =============================================================================
# PRODUCTS
# =============================================================================

PRODUCTS = [
    {
        "sku": "shattaf-chrome-classic",
        "name": "Shattaf Chrome Classique",
        "description": "Douchette WC chrome finition brillante avec flexible 1.2m",
        "category": ProductCategory.SHATTAF,
        "supplier_price": 4000,
        "price_b2c": 15000,
        "image_url": "/images/products/shattaf-chrome.webp",
        "is_available": True,
        "stock_quantity": 500,
    },
    {
        "sku": "shattaf-white-premium",
        "name": "Shattaf Blanc Premium",
        "description": "Douchette WC finition blanche mate, design moderne",
        "category": ProductCategory.SHATTAF,
        "supplier_price": 5000,
        "price_b2c": 16000,
        "image_url": "/images/products/shattaf-white.webp",
        "is_available": True,
        "stock_quantity": 350,
    },
    {
        "sku": "shattaf-inox-pro",
        "name": "Shattaf Inox Professionnel",
        "description": "Douchette WC inox haute qualité, résistant à la corrosion",
        "category": ProductCategory.SHATTAF,
        "supplier_price": 6000,
        "price_b2c": 17000,
        "image_url": "/images/products/shattaf-inox.webp",
        "is_available": True,
        "stock_quantity": 250,
    },
]


# =============================================================================
# SEED FUNCTION
# =============================================================================

NUM_PLUMBERS = 48
NUM_CUSTOMERS = 450  # More customers than interventions to allow variety
NUM_INTERVENTIONS = 402


async def seed():
    """Seed the database with all data."""
    # Reserve the test account phone numbers
    _used_phones.add("+590690000001")  # admin
    _used_phones.add("+590690100001")  # plumber
    _used_phones.add("+590690200001")  # customer

    await init_db()

    async with db_module.async_session_factory() as session:
        from sqlalchemy import select

        # ---------------------------------------------------------------------
        # Pricing Config
        # ---------------------------------------------------------------------
        result = await session.execute(
            select(PricingConfig).where(PricingConfig.name == "default")
        )
        config = result.scalar_one_or_none()

        if not config:
            config = PricingConfig(
                name="default",
                plumber_travel_fee=2000,
                plumber_labor_fee=5000,
                commission_first_unit=4000,
                commission_additional=1000,
                b2b_discount_percent=15,
                notes="Configuration par défaut pour Guadeloupe",
            )
            session.add(config)
            print("✓ Created default pricing config")
        else:
            print("✓ Pricing config already exists")

        # ---------------------------------------------------------------------
        # Products
        # ---------------------------------------------------------------------
        products = []
        for product_data in PRODUCTS:
            result = await session.execute(
                select(Product).where(Product.sku == product_data["sku"])
            )
            existing = result.scalar_one_or_none()

            if not existing:
                product = Product(**product_data)
                session.add(product)
                products.append(product)
                print(f"✓ Created product: {product_data['name']}")
            else:
                products.append(existing)
                print(f"✓ Product already exists: {product_data['name']}")

        await session.flush()

        # ---------------------------------------------------------------------
        # Admin User
        # ---------------------------------------------------------------------
        result = await session.execute(
            select(User).where(User.email == "admin@test.com")
        )
        if not result.scalar_one_or_none():
            admin = User(
                email="admin@test.com",
                hashed_password=AuthService.hash_password("admin123"),
                first_name="Admin",
                last_name="Test",
                role=UserRole.ADMIN,
                phone="+590690000001",
                is_active=True,
                is_verified=True,
            )
            session.add(admin)
            print("✓ Created admin: admin@test.com")
        else:
            print("✓ Admin already exists: admin@test.com")

        # ---------------------------------------------------------------------
        # Plumber Users + Profiles (48 plumbers)
        # ---------------------------------------------------------------------
        result = await session.execute(
            select(User).where(User.role == UserRole.PLUMBER)
        )
        existing_plumbers = result.scalars().all()
        plumbers = list(existing_plumbers)

        if len(existing_plumbers) < NUM_PLUMBERS:
            # Create test plumber first
            result = await session.execute(
                select(User).where(User.email == "plumber@test.com")
            )
            if not result.scalar_one_or_none():
                user = User(
                    email="plumber@test.com",
                    hashed_password=AuthService.hash_password("plumber123"),
                    first_name="Jean",
                    last_name="Plombier",
                    role=UserRole.PLUMBER,
                    phone="+590690100001",
                    is_active=True,
                    is_verified=True,
                )
                session.add(user)
                await session.flush()
                city = CITIES[0]  # Pointe-à-Pitre
                profile = PlumberProfile(
                    user_id=user.id,
                    status=PlumberStatus.ACTIVE,
                    department=Department.GUADELOUPE,
                    years_experience=10,
                    service_area_lat=city["lat"],
                    service_area_lng=city["lng"],
                    service_area_radius_km=30.0,
                    average_rating=4.8,
                    total_jobs_completed=115,
                    total_ratings=120,
                )
                session.add(profile)
                plumbers.append(user)
                print("✓ Created plumber: plumber@test.com")

            # Generate remaining plumbers
            used_names = set()
            for i in range(len(plumbers), NUM_PLUMBERS):
                # Generate unique name combination
                while True:
                    first_name = random.choice(FIRST_NAMES)
                    last_name = random.choice(LAST_NAMES)
                    name_key = f"{first_name}_{last_name}"
                    if name_key not in used_names:
                        used_names.add(name_key)
                        break

                email = f"{first_name.lower()}.{last_name.lower()}{i}@plombier.gp".replace("é", "e").replace("è", "e").replace("ç", "c")

                user = User(
                    email=email,
                    hashed_password=AuthService.hash_password("plumber123"),
                    first_name=first_name,
                    last_name=last_name,
                    role=UserRole.PLUMBER,
                    phone=generate_phone("0690"),
                    is_active=True,
                    is_verified=True,
                )
                session.add(user)
                await session.flush()

                city = random.choice(CITIES)
                # Generate 2-5 intervention locations for this plumber
                intervention_locations = []
                num_interventions = random.randint(2, 5)
                for _ in range(num_interventions):
                    int_city = random.choice(CITIES)
                    intervention_locations.append({
                        "lat": int_city["lat"] + random.uniform(-0.03, 0.03),
                        "lng": int_city["lng"] + random.uniform(-0.03, 0.03),
                        "address": f"{random.randint(1, 100)} {random.choice(STREET_TYPES)} {random.choice(STREET_NAMES)}, {int_city['name']}",
                        "label": f"Zone {int_city['name']}"
                    })

                profile = PlumberProfile(
                    user_id=user.id,
                    status=random.choice([PlumberStatus.ACTIVE, PlumberStatus.ACTIVE, PlumberStatus.ACTIVE, PlumberStatus.INACTIVE]),
                    department=Department.GUADELOUPE,
                    years_experience=random.randint(2, 20),
                    service_area_lat=city["lat"] + random.uniform(-0.05, 0.05),
                    service_area_lng=city["lng"] + random.uniform(-0.05, 0.05),
                    service_area_radius_km=float(random.randint(15, 50)),
                    average_rating=round(random.uniform(3.8, 5.0), 1),
                    total_jobs_completed=random.randint(5, 180),
                    total_ratings=random.randint(5, 200),
                    intervention_locations=intervention_locations,
                )
                session.add(profile)
                plumbers.append(user)

            print(f"✓ Created {NUM_PLUMBERS} plumbers total")
        else:
            print(f"✓ Plumbers already exist ({len(existing_plumbers)} found)")

        await session.flush()

        # ---------------------------------------------------------------------
        # Customer Users (450 customers)
        # ---------------------------------------------------------------------
        result = await session.execute(
            select(User).where(User.role == UserRole.CUSTOMER)
        )
        existing_customers = result.scalars().all()
        customers = list(existing_customers)

        if len(existing_customers) < NUM_CUSTOMERS:
            # Create test customer first
            result = await session.execute(
                select(User).where(User.email == "customer@test.com")
            )
            if not result.scalar_one_or_none():
                user = User(
                    email="customer@test.com",
                    hashed_password=AuthService.hash_password("customer123"),
                    first_name="Marie",
                    last_name="Client",
                    role=UserRole.CUSTOMER,
                    phone="+590690200001",
                    is_active=True,
                    is_verified=True,
                )
                session.add(user)
                customers.append(user)
                print("✓ Created customer: customer@test.com")

            # Generate remaining customers
            used_names = set()
            for i in range(len(customers), NUM_CUSTOMERS):
                while True:
                    first_name = random.choice(FIRST_NAMES)
                    last_name = random.choice(LAST_NAMES)
                    name_key = f"{first_name}_{last_name}"
                    if name_key not in used_names:
                        used_names.add(name_key)
                        break

                email = f"{first_name.lower()}.{last_name.lower()}{i}@email.gp".replace("é", "e").replace("è", "e").replace("ç", "c")

                user = User(
                    email=email,
                    hashed_password=AuthService.hash_password("customer123"),
                    first_name=first_name,
                    last_name=last_name,
                    role=UserRole.CUSTOMER,
                    phone=generate_phone("0690"),
                    is_active=True,
                    is_verified=True,
                )
                session.add(user)
                customers.append(user)

            print(f"✓ Created {NUM_CUSTOMERS} customers total")
        else:
            print(f"✓ Customers already exist ({len(existing_customers)} found)")

        await session.flush()

        # ---------------------------------------------------------------------
        # Interventions: Bookings, Quotes, Orders, Jobs (402 interventions)
        # Distribution: past (completed) + present (in progress) + future (scheduled)
        # ---------------------------------------------------------------------
        result = await session.execute(select(Booking))
        existing_bookings = result.scalars().all()

        if len(existing_bookings) < NUM_INTERVENTIONS:
            now = datetime.utcnow()

            # Distribution of interventions
            # Past completed: 280 (70%)
            # Present/recent: 72 (18%)
            # Future scheduled: 50 (12%)

            booking_count = 0
            order_count = 0
            order_number = 1000

            # === PAST COMPLETED INTERVENTIONS (280) ===
            for i in range(280):
                customer = random.choice(customers)
                plumber = random.choice([p for p in plumbers if p.email != "plumber@test.com"] or plumbers)
                product = random.choice(products)
                address = generate_address()

                # Random date in past 6 months
                days_ago = random.randint(7, 180)
                created_at = now - timedelta(days=days_ago)
                scheduled_date = created_at + timedelta(days=random.randint(2, 7))

                booking = Booking(
                    customer_id=customer.id,
                    status=BookingStatus.ACCEPTED,
                    address_street=address["street"],
                    address_city=address["city"],
                    address_postal_code=address["postal"],
                    address_lat=address["lat"],
                    address_lng=address["lng"],
                    toilet_type=random.choice([ToiletType.STANDARD, ToiletType.STANDARD, ToiletType.WALL_HUNG]),
                    product_id=product.id,
                    preferred_date=scheduled_date,
                    assigned_plumber_id=plumber.id,
                    additional_notes=random.choice([
                        None, None, None,
                        "Appartement au 2ème étage sans ascenseur",
                        "Maison avec jardin, parking disponible",
                        "Accès par le garage",
                        "Sonnez à l'interphone",
                        "Chien dans la cour, appeler avant",
                        "Code portail: 1234",
                    ]),
                )
                booking.created_at = created_at
                session.add(booking)
                await session.flush()

                installation_price = 5000
                platform_fee = 4000
                total_price = product.supplier_price + installation_price + platform_fee

                quote = Quote(
                    booking_id=booking.id,
                    plumber_id=plumber.id,
                    status=QuoteStatus.ACCEPTED,
                    installation_price=installation_price,
                    product_price=product.supplier_price,
                    platform_fee=platform_fee,
                    total_price=total_price,
                    proposed_date=scheduled_date,
                    proposed_time_slot=random.choice(["morning", "afternoon"]),
                    estimated_duration_minutes=random.randint(30, 60),
                    valid_until=created_at + timedelta(days=7),
                    plumber_notes="Installation standard.",
                )
                session.add(quote)
                await session.flush()

                order_number += 1
                order = Order(
                    order_number=f"ORD-{order_number}",
                    customer_id=customer.id,
                    plumber_id=plumber.id,
                    booking_id=booking.id,
                    quote_id=quote.id,
                    status=OrderStatus.COMPLETED,
                    payment_status=PaymentStatus.CAPTURED,
                    product_subtotal=product.supplier_price,
                    installation_subtotal=installation_price,
                    platform_fee=platform_fee,
                    vat_amount=0,
                    total_amount=total_price,
                    scheduled_date=scheduled_date,
                    scheduled_time_slot=random.choice(["09:00-12:00", "14:00-17:00"]),
                    completed_at=scheduled_date + timedelta(hours=random.randint(1, 3)),
                    customer_rating=random.choice([4, 4, 5, 5, 5, None]),
                    customer_review=random.choice([None, None, "Très satisfait!", "Travail propre et rapide", "Excellent service"]),
                )
                session.add(order)
                await session.flush()
                order_count += 1

                job = Job(
                    order_id=order.id,
                    plumber_id=plumber.id,
                    status=JobStatus.COMPLETED,
                    scheduled_date=scheduled_date,
                    work_started_at=scheduled_date + timedelta(hours=random.randint(0, 2)),
                    work_completed_at=scheduled_date + timedelta(hours=random.randint(1, 3)),
                    completed_at=scheduled_date + timedelta(hours=random.randint(1, 3)),
                    plumber_notes="Installation effectuée sans problème.",
                )
                session.add(job)
                booking_count += 1

            print(f"✓ Created 280 past completed interventions")

            # === PRESENT/RECENT INTERVENTIONS (72) ===
            # Mix of: submitted, quoted, accepted (scheduled/in_progress)

            # 20 submitted (waiting for plumber)
            for i in range(20):
                customer = random.choice(customers)
                product = random.choice(products)
                address = generate_address()

                days_ago = random.randint(0, 5)
                created_at = now - timedelta(days=days_ago)
                preferred_date = now + timedelta(days=random.randint(3, 14))

                booking = Booking(
                    customer_id=customer.id,
                    status=BookingStatus.SUBMITTED,
                    address_street=address["street"],
                    address_city=address["city"],
                    address_postal_code=address["postal"],
                    address_lat=address["lat"],
                    address_lng=address["lng"],
                    toilet_type=random.choice([ToiletType.STANDARD, ToiletType.WALL_HUNG]),
                    product_id=product.id,
                    preferred_date=preferred_date,
                    additional_notes=random.choice([None, "Urgent svp", "Disponible le matin"]),
                )
                booking.created_at = created_at
                session.add(booking)
                booking_count += 1

            print(f"✓ Created 20 submitted bookings")

            # 15 quoted (waiting customer response)
            for i in range(15):
                customer = random.choice(customers)
                plumber = random.choice(plumbers)
                product = random.choice(products)
                address = generate_address()

                days_ago = random.randint(1, 4)
                created_at = now - timedelta(days=days_ago)
                preferred_date = now + timedelta(days=random.randint(2, 10))

                booking = Booking(
                    customer_id=customer.id,
                    status=BookingStatus.QUOTED,
                    address_street=address["street"],
                    address_city=address["city"],
                    address_postal_code=address["postal"],
                    address_lat=address["lat"],
                    address_lng=address["lng"],
                    toilet_type=random.choice([ToiletType.STANDARD, ToiletType.WALL_HUNG]),
                    product_id=product.id,
                    preferred_date=preferred_date,
                    assigned_plumber_id=plumber.id,
                )
                booking.created_at = created_at
                session.add(booking)
                await session.flush()

                installation_price = 5000
                platform_fee = 4000
                total_price = product.supplier_price + installation_price + platform_fee

                quote = Quote(
                    booking_id=booking.id,
                    plumber_id=plumber.id,
                    status=QuoteStatus.PENDING,
                    installation_price=installation_price,
                    product_price=product.supplier_price,
                    platform_fee=platform_fee,
                    total_price=total_price,
                    proposed_date=preferred_date,
                    proposed_time_slot=random.choice(["morning", "afternoon"]),
                    estimated_duration_minutes=45,
                    valid_until=now + timedelta(days=5),
                    plumber_notes="Disponible à la date demandée.",
                )
                session.add(quote)
                booking_count += 1

            print(f"✓ Created 15 quoted bookings")

            # 37 accepted with scheduled/in_progress jobs
            for i in range(37):
                customer = random.choice(customers)
                plumber = random.choice(plumbers)
                product = random.choice(products)
                address = generate_address()

                days_ago = random.randint(1, 7)
                created_at = now - timedelta(days=days_ago)
                # Some in past (today or yesterday), some in near future
                if i < 10:
                    scheduled_date = now - timedelta(days=random.randint(0, 1))  # Today/yesterday
                    order_status = OrderStatus.IN_PROGRESS
                    job_status = JobStatus.IN_PROGRESS
                else:
                    scheduled_date = now + timedelta(days=random.randint(1, 7))  # Near future
                    order_status = OrderStatus.SCHEDULED
                    job_status = JobStatus.SCHEDULED

                booking = Booking(
                    customer_id=customer.id,
                    status=BookingStatus.ACCEPTED,
                    address_street=address["street"],
                    address_city=address["city"],
                    address_postal_code=address["postal"],
                    address_lat=address["lat"],
                    address_lng=address["lng"],
                    toilet_type=random.choice([ToiletType.STANDARD, ToiletType.WALL_HUNG]),
                    product_id=product.id,
                    preferred_date=scheduled_date,
                    assigned_plumber_id=plumber.id,
                )
                booking.created_at = created_at
                session.add(booking)
                await session.flush()

                installation_price = 5000
                platform_fee = 4000
                total_price = product.supplier_price + installation_price + platform_fee

                quote = Quote(
                    booking_id=booking.id,
                    plumber_id=plumber.id,
                    status=QuoteStatus.ACCEPTED,
                    installation_price=installation_price,
                    product_price=product.supplier_price,
                    platform_fee=platform_fee,
                    total_price=total_price,
                    proposed_date=scheduled_date,
                    proposed_time_slot=random.choice(["morning", "afternoon"]),
                    estimated_duration_minutes=45,
                    valid_until=created_at + timedelta(days=7),
                )
                session.add(quote)
                await session.flush()

                order_number += 1
                order = Order(
                    order_number=f"ORD-{order_number}",
                    customer_id=customer.id,
                    plumber_id=plumber.id,
                    booking_id=booking.id,
                    quote_id=quote.id,
                    status=order_status,
                    payment_status=PaymentStatus.CAPTURED,
                    product_subtotal=product.supplier_price,
                    installation_subtotal=installation_price,
                    platform_fee=platform_fee,
                    vat_amount=0,
                    total_amount=total_price,
                    scheduled_date=scheduled_date,
                    scheduled_time_slot=random.choice(["09:00-12:00", "14:00-17:00"]),
                )
                session.add(order)
                await session.flush()
                order_count += 1

                job = Job(
                    order_id=order.id,
                    plumber_id=plumber.id,
                    status=job_status,
                    scheduled_date=scheduled_date,
                    work_started_at=scheduled_date if job_status == JobStatus.IN_PROGRESS else None,
                )
                session.add(job)
                booking_count += 1

            print(f"✓ Created 37 accepted/scheduled bookings")

            # === FUTURE SCHEDULED (50) ===
            for i in range(50):
                customer = random.choice(customers)
                plumber = random.choice(plumbers)
                product = random.choice(products)
                address = generate_address()

                days_ago = random.randint(1, 5)
                created_at = now - timedelta(days=days_ago)
                scheduled_date = now + timedelta(days=random.randint(8, 30))

                booking = Booking(
                    customer_id=customer.id,
                    status=BookingStatus.ACCEPTED,
                    address_street=address["street"],
                    address_city=address["city"],
                    address_postal_code=address["postal"],
                    address_lat=address["lat"],
                    address_lng=address["lng"],
                    toilet_type=random.choice([ToiletType.STANDARD, ToiletType.WALL_HUNG]),
                    product_id=product.id,
                    preferred_date=scheduled_date,
                    assigned_plumber_id=plumber.id,
                )
                booking.created_at = created_at
                session.add(booking)
                await session.flush()

                installation_price = 5000
                platform_fee = 4000
                total_price = product.supplier_price + installation_price + platform_fee

                quote = Quote(
                    booking_id=booking.id,
                    plumber_id=plumber.id,
                    status=QuoteStatus.ACCEPTED,
                    installation_price=installation_price,
                    product_price=product.supplier_price,
                    platform_fee=platform_fee,
                    total_price=total_price,
                    proposed_date=scheduled_date,
                    proposed_time_slot=random.choice(["morning", "afternoon"]),
                    estimated_duration_minutes=45,
                    valid_until=created_at + timedelta(days=14),
                )
                session.add(quote)
                await session.flush()

                order_number += 1
                order = Order(
                    order_number=f"ORD-{order_number}",
                    customer_id=customer.id,
                    plumber_id=plumber.id,
                    booking_id=booking.id,
                    quote_id=quote.id,
                    status=OrderStatus.SCHEDULED,
                    payment_status=PaymentStatus.CAPTURED,
                    product_subtotal=product.supplier_price,
                    installation_subtotal=installation_price,
                    platform_fee=platform_fee,
                    vat_amount=0,
                    total_amount=total_price,
                    scheduled_date=scheduled_date,
                    scheduled_time_slot=random.choice(["09:00-12:00", "14:00-17:00"]),
                )
                session.add(order)
                await session.flush()
                order_count += 1

                job = Job(
                    order_id=order.id,
                    plumber_id=plumber.id,
                    status=JobStatus.SCHEDULED,
                    scheduled_date=scheduled_date,
                )
                session.add(job)
                booking_count += 1

            print(f"✓ Created 50 future scheduled interventions")
            print(f"✓ Total: {booking_count} bookings, {order_count} orders")
        else:
            print(f"✓ Bookings already exist ({len(existing_bookings)} found)")

        await session.commit()

    print("\n" + "=" * 60)
    print("✓ Seed completed!")
    print("=" * 60)
    print(f"\nData summary:")
    print(f"  - {NUM_PLUMBERS} plumbers")
    print(f"  - {NUM_CUSTOMERS} customers")
    print(f"  - {NUM_INTERVENTIONS} interventions (280 past, 72 present, 50 future)")
    print("\nTest accounts:")
    print("  Admin:    admin@test.com / admin123")
    print("  Plumber:  plumber@test.com / plumber123")
    print("  Customer: customer@test.com / customer123")


if __name__ == "__main__":
    asyncio.run(seed())
