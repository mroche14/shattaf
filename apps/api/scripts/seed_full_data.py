#!/usr/bin/env python3
"""Comprehensive seed script to populate database with realistic test data."""

import asyncio
import os
import sys
import random
from datetime import datetime, timedelta
from pathlib import Path
from uuid import uuid4
from decimal import Decimal

# Set up proper module paths
api_root = Path(__file__).parent.parent
sys.path.insert(0, str(api_root))
os.chdir(api_root)

from src.database import init_db
from src.services.auth import AuthService
from src.models import User, UserRole
from src.models.plumber import PlumberProfile, PlumberStatus, Department
from src.models.customer import CustomerProfile
from src.models.product import Product, ProductCategory
from src.models.booking import Booking, BookingStatus, ToiletType
from src.models.quote import Quote, QuoteStatus
from src.models.order import Order, OrderStatus, PaymentStatus
from src.models.job import Job, JobStatus
from src.models.invoice import Invoice, InvoiceStatus

# French first names
FIRST_NAMES = [
    "Marie", "Jean", "Pierre", "Sophie", "Lucas", "Emma", "Louis", "Léa",
    "Gabriel", "Manon", "Raphaël", "Chloé", "Arthur", "Inès", "Adam", "Jade",
    "Paul", "Louise", "Hugo", "Alice", "Nathan", "Lina", "Ethan", "Rose",
    "Théo", "Anna", "Noah", "Camille", "Léo", "Sarah", "Jules", "Eva",
    "Mathis", "Zoé", "Enzo", "Mila", "Tom", "Ambre", "Sacha", "Nina",
    "Antoine", "Juliette", "Clément", "Charlotte", "Maxime", "Agathe",
]

# French last names
LAST_NAMES = [
    "Martin", "Bernard", "Thomas", "Petit", "Robert", "Richard", "Durand",
    "Dubois", "Moreau", "Laurent", "Simon", "Michel", "Lefebvre", "Leroy",
    "Roux", "David", "Bertrand", "Morel", "Fournier", "Girard", "Bonnet",
    "Dupont", "Lambert", "Fontaine", "Rousseau", "Vincent", "Muller", "Lefevre",
    "Faure", "Andre", "Mercier", "Blanc", "Guerin", "Boyer", "Garnier",
]

# Company name templates
COMPANY_TEMPLATES = [
    "{last} Plomberie", "Ets {last}", "{last} & Fils", "Plomberie {last}",
    "{last} Services", "Pro Plomb {last}", "{last} Installation",
]

# Real locations per department
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

# Street name templates
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


# Global counter for unique phone numbers
_phone_counter = 0

def random_phone(dept: str) -> str:
    """Generate a unique phone number for department."""
    global _phone_counter
    _phone_counter += 1
    return f"+590690{_phone_counter:06d}"


def random_street() -> str:
    """Generate a random street address."""
    template = random.choice(STREET_TEMPLATES)
    name = random.choice(STREET_NAMES)
    number = random.randint(1, 150)
    return f"{number} {template.format(name)}"


def add_location_noise(lat: float, lng: float, km_range: float = 5.0) -> tuple:
    """Add random noise to coordinates within km_range."""
    # 1 degree latitude ~ 111 km
    lat_noise = random.uniform(-km_range / 111, km_range / 111)
    lng_noise = random.uniform(-km_range / 111, km_range / 111)
    return lat + lat_noise, lng + lng_noise


async def seed_full_data():
    """Create comprehensive test data."""
    print("\n" + "=" * 60)
    print("SEEDING FULL DATABASE")
    print("=" * 60 + "\n")

    await init_db()
    from src import database

    async with database.async_session_factory() as session:
        # ============== Products ==============
        print("Creating products...")
        products = [
            Product(
                sku="SHATTAF-BASIC",
                name="Shattaf Classique",
                description="Douchette WC classique avec tuyau inox et support mural",
                category=ProductCategory.SHATTAF,
                price_b2c=4900,  # 49 EUR
                price_b2b=3500,
                vat_rate=Decimal("8.5"),
                stock_quantity=500,
                is_available=True,
                installation_price=5000,  # 50 EUR
                image_url="/images/shattaf-basic.webp",
            ),
            Product(
                sku="SHATTAF-PREMIUM",
                name="Shattaf Premium Chrome",
                description="Douchette WC premium chromée avec régulateur de pression",
                category=ProductCategory.SHATTAF,
                price_b2c=7900,  # 79 EUR
                price_b2b=5500,
                vat_rate=Decimal("8.5"),
                stock_quantity=300,
                is_available=True,
                installation_price=5000,
                image_url="/images/shattaf-premium.webp",
            ),
            Product(
                sku="SHATTAF-GOLD",
                name="Shattaf Gold Edition",
                description="Douchette WC haut de gamme finition dorée",
                category=ProductCategory.SHATTAF,
                price_b2c=12900,  # 129 EUR
                price_b2b=9000,
                vat_rate=Decimal("8.5"),
                stock_quantity=100,
                is_available=True,
                installation_price=6000,
                image_url="/images/shattaf-gold.webp",
            ),
            Product(
                sku="KIT-INSTALL",
                name="Kit Installation Complet",
                description="Robinet d'arrêt, flexible, joints et fixations",
                category=ProductCategory.KIT,
                price_b2c=2900,  # 29 EUR
                price_b2b=2000,
                vat_rate=Decimal("8.5"),
                stock_quantity=1000,
                is_available=True,
                installation_price=0,
                image_url="/images/kit-install.webp",
            ),
        ]
        for product in products:
            session.add(product)
        await session.flush()
        product_ids = [p.id for p in products]
        print(f"  Created {len(products)} products")

        # ============== Admin User ==============
        print("Creating admin user...")
        admin_exists = await session.execute(
            session.query(User).filter(User.email == "admin@shattaf.fr")
        ) if hasattr(session, 'query') else None

        admin_user = User(
            email="admin@shattaf.fr",
            phone="+590690000000",
            hashed_password=AuthService.hash_password("Admin123!"),
            first_name="Admin",
            last_name="Shattaf",
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True,
        )
        session.add(admin_user)
        await session.flush()
        print(f"  Created admin: admin@shattaf.fr / Admin123!")

        # ============== Plumbers ==============
        print("\nCreating plumbers...")
        plumber_counts = {"971": 22, "972": 52, "973": 36}  # 110 total
        plumber_profiles = []
        plumber_users = []

        for dept_code, count in plumber_counts.items():
            dept_info = LOCATIONS[dept_code]
            print(f"  Creating {count} plumbers in {dept_info['name']}...")

            for i in range(count):
                first_name = random.choice(FIRST_NAMES)
                last_name = random.choice(LAST_NAMES)
                city = random.choice(dept_info["cities"])

                # Create user
                user = User(
                    email=f"plumber{dept_code}_{i+1}@shattaf.fr",
                    phone=random_phone(dept_code),
                    hashed_password=AuthService.hash_password("Test123!"),
                    first_name=first_name,
                    last_name=last_name,
                    role=UserRole.PLUMBER,
                    is_active=True,
                    is_verified=True,
                )
                session.add(user)
                await session.flush()
                plumber_users.append(user)

                # Add location noise for realism
                lat, lng = add_location_noise(city["lat"], city["lng"], km_range=8.0)

                # Create intervention locations (1-3 per plumber)
                intervention_locations = []
                num_locations = random.randint(1, 3)
                for j in range(num_locations):
                    loc_city = random.choice(dept_info["cities"])
                    loc_lat, loc_lng = add_location_noise(loc_city["lat"], loc_city["lng"], km_range=3.0)
                    intervention_locations.append({
                        "lat": loc_lat,
                        "lng": loc_lng,
                        "address": f"{random_street()}, {loc_city['postal']} {loc_city['name']}",
                        "label": loc_city["name"],
                    })

                # Create plumber profile
                profile = PlumberProfile(
                    user_id=user.id,
                    status=random.choices(
                        [PlumberStatus.ACTIVE, PlumberStatus.PENDING, PlumberStatus.SUSPENDED],
                        weights=[85, 10, 5]
                    )[0],
                    department=Department(dept_code),
                    company_name=random.choice(COMPANY_TEMPLATES).format(last=last_name),
                    siren=f"{random.randint(100, 999)}{random.randint(100, 999)}{random.randint(100, 999)}",
                    siret=f"{random.randint(100, 999)}{random.randint(100, 999)}{random.randint(100, 999)}{random.randint(10000, 99999)}",
                    service_area_lat=lat,
                    service_area_lng=lng,
                    service_area_radius_km=random.uniform(15.0, 40.0),
                    intervention_locations=intervention_locations,
                    years_experience=random.randint(2, 25),
                    total_jobs_completed=random.randint(0, 150),
                    average_rating=round(random.uniform(3.5, 5.0), 1) if random.random() > 0.2 else None,
                    total_ratings=random.randint(0, 50),
                    stripe_charges_enabled=random.random() > 0.1,
                    mandate_signed=random.random() > 0.15,
                )
                session.add(profile)
                plumber_profiles.append(profile)

        await session.flush()
        print(f"  Created {len(plumber_profiles)} plumbers total")

        # ============== Customers ==============
        print("\nCreating customers...")
        customer_profiles = []
        customer_users = []

        for i in range(341):
            dept_code = random.choice(["971", "972", "973"])
            dept_info = LOCATIONS[dept_code]
            city = random.choice(dept_info["cities"])
            first_name = random.choice(FIRST_NAMES)
            last_name = random.choice(LAST_NAMES)

            lat, lng = add_location_noise(city["lat"], city["lng"], km_range=5.0)

            user = User(
                email=f"customer{i+1}@example.com",
                phone=random_phone(dept_code),
                hashed_password=AuthService.hash_password("Test123!"),
                first_name=first_name,
                last_name=last_name,
                role=UserRole.CUSTOMER,
                is_active=True,
                is_verified=True,
            )
            session.add(user)
            await session.flush()
            customer_users.append(user)

            profile = CustomerProfile(
                user_id=user.id,
                address_street=random_street(),
                address_city=city["name"],
                address_postal_code=city["postal"],
                address_country=dept_info["name"],
                address_lat=lat,
                address_lng=lng,
                floor=random.choice([None, 0, 1, 2, 3]) if random.random() > 0.5 else None,
                digicode=f"{random.randint(1000, 9999)}" if random.random() > 0.7 else None,
            )
            session.add(profile)
            customer_profiles.append(profile)

            if (i + 1) % 100 == 0:
                print(f"    Created {i + 1}/341 customers...")

        await session.flush()
        print(f"  Created {len(customer_profiles)} customers")

        # ============== Bookings, Quotes, Orders, Jobs ==============
        print("\nCreating interventions (bookings, quotes, orders, jobs)...")

        # 402 interventions: mix of past (completed), current, and future
        now = datetime.utcnow()
        jobs_created = 0
        orders_created = 0
        order_counter = 1
        invoice_counter = 1

        # Distribution: 300 completed (past), 52 scheduled (future), 50 in various states
        for i in range(402):
            customer = random.choice(customer_users)
            customer_profile = next((p for p in customer_profiles if p.user_id == customer.id), None)

            dept_code = customer_profile.address_postal_code[:3] if customer_profile else "971"
            dept_plumbers = [p for p in plumber_profiles if p.department and p.department.value == dept_code and p.status == PlumberStatus.ACTIVE]

            if not dept_plumbers:
                dept_plumbers = [p for p in plumber_profiles if p.status == PlumberStatus.ACTIVE]

            if not dept_plumbers:
                continue

            plumber_profile = random.choice(dept_plumbers)
            plumber_user = next((u for u in plumber_users if u.id == plumber_profile.user_id), None)

            if not plumber_user:
                continue

            product = random.choice(products[:3])  # Only shattaf products

            # Determine intervention timing
            if i < 300:
                # Completed (past)
                days_ago = random.randint(1, 365)
                booking_date = now - timedelta(days=days_ago)
                scheduled_date = booking_date + timedelta(days=random.randint(1, 7))
                completed = True
            elif i < 352:
                # Scheduled (future)
                days_ahead = random.randint(1, 30)
                booking_date = now - timedelta(days=random.randint(1, 14))
                scheduled_date = now + timedelta(days=days_ahead)
                completed = False
            else:
                # Various states (current)
                booking_date = now - timedelta(days=random.randint(0, 7))
                scheduled_date = now + timedelta(days=random.randint(-2, 5))
                completed = random.random() > 0.5

            lat, lng = (customer_profile.address_lat, customer_profile.address_lng) if customer_profile else (16.2411, -61.5331)

            # Create booking
            booking_status = BookingStatus.ACCEPTED if completed or i < 352 else random.choice([
                BookingStatus.DRAFT, BookingStatus.SUBMITTED, BookingStatus.QUOTED
            ])

            booking = Booking(
                customer_id=customer.id,
                status=booking_status,
                address_street=customer_profile.address_street if customer_profile else random_street(),
                address_city=customer_profile.address_city if customer_profile else "Pointe-à-Pitre",
                address_postal_code=customer_profile.address_postal_code if customer_profile else "97110",
                address_country=customer_profile.address_country if customer_profile else "Guadeloupe",
                address_lat=lat,
                address_lng=lng,
                toilet_type=random.choice([ToiletType.STANDARD, ToiletType.WALL_HUNG]),
                shutoff_valve_accessible=random.random() > 0.1,
                preferred_date=scheduled_date,
                preferred_time_slot=random.choice(["morning", "afternoon", "evening"]),
                product_id=product.id,
                assigned_plumber_id=plumber_user.id if booking_status == BookingStatus.ACCEPTED else None,
                matched_at=booking_date if booking_status == BookingStatus.ACCEPTED else None,
                created_at=booking_date,
            )
            session.add(booking)
            await session.flush()

            # Create quote, order, job for accepted bookings
            if booking_status == BookingStatus.ACCEPTED:
                # Create quote
                quote = Quote(
                    booking_id=booking.id,
                    plumber_id=plumber_user.id,
                    status=QuoteStatus.ACCEPTED,
                    installation_price=product.installation_price,
                    product_price=product.price_b2c,
                    platform_fee=int((product.price_b2c + product.installation_price) * 0.10),
                    total_price=product.price_b2c + product.installation_price,
                    proposed_date=scheduled_date,
                    proposed_time_slot=random.choice(["morning", "afternoon"]),
                    valid_until=scheduled_date + timedelta(days=7),
                    customer_response_at=booking_date + timedelta(hours=random.randint(1, 48)),
                    created_at=booking_date,
                )
                session.add(quote)
                await session.flush()

                # Create order
                order_status = OrderStatus.COMPLETED if completed else OrderStatus.SCHEDULED
                order = Order(
                    order_number=f"ORD-{order_counter:06d}",
                    customer_id=customer.id,
                    plumber_id=plumber_user.id,
                    booking_id=booking.id,
                    quote_id=quote.id,
                    status=order_status,
                    payment_status=PaymentStatus.CAPTURED if completed else PaymentStatus.AUTHORIZED,
                    product_subtotal=product.price_b2c,
                    installation_subtotal=product.installation_price,
                    platform_fee=int((product.price_b2c + product.installation_price) * 0.10),
                    vat_amount=int((product.price_b2c + product.installation_price) * 0.085),
                    total_amount=product.price_b2c + product.installation_price,
                    scheduled_date=scheduled_date,
                    scheduled_time_slot=random.choice(["morning", "afternoon"]),
                    completed_at=scheduled_date + timedelta(hours=random.randint(1, 4)) if completed else None,
                    customer_rating=random.randint(3, 5) if completed and random.random() > 0.3 else None,
                    created_at=booking_date,
                )
                session.add(order)
                await session.flush()
                order_counter += 1
                orders_created += 1

                # Create job
                job_status = JobStatus.COMPLETED if completed else JobStatus.SCHEDULED
                job = Job(
                    order_id=order.id,
                    plumber_id=plumber_user.id,
                    status=job_status,
                    scheduled_date=scheduled_date,
                    checkin_time=scheduled_date if completed else None,
                    checkin_lat=lat + random.uniform(-0.001, 0.001) if completed else None,
                    checkin_lng=lng + random.uniform(-0.001, 0.001) if completed else None,
                    start_time=scheduled_date + timedelta(minutes=random.randint(5, 30)) if completed else None,
                    work_started_at=scheduled_date + timedelta(minutes=random.randint(5, 30)) if completed else None,
                    work_completed_at=scheduled_date + timedelta(minutes=random.randint(45, 90)) if completed else None,
                    completed_at=scheduled_date + timedelta(minutes=random.randint(45, 90)) if completed else None,
                    signature_name=f"{customer.first_name} {customer.last_name}" if completed else "",
                    created_at=booking_date,
                )
                session.add(job)
                jobs_created += 1

                # Create invoice for completed orders
                if completed:
                    invoice = Invoice(
                        invoice_number=f"FAC-{invoice_counter:06d}",
                        order_id=order.id,
                        status=InvoiceStatus.PAID,
                        customer_id=customer.id,
                        customer_name=f"{customer.first_name} {customer.last_name}",
                        customer_address=f"{booking.address_street}, {booking.address_postal_code} {booking.address_city}",
                        customer_email=customer.email,
                        plumber_id=plumber_user.id,
                        plumber_name=plumber_profile.company_name or f"{plumber_user.first_name} {plumber_user.last_name}",
                        plumber_siren=plumber_profile.siren or "",
                        invoice_date=scheduled_date.date(),
                        due_date=(scheduled_date + timedelta(days=30)).date(),
                        paid_date=scheduled_date.date(),
                        subtotal_products=product.price_b2c,
                        subtotal_installation=product.installation_price,
                        vat_products=int(product.price_b2c * 0.085),
                        vat_installation=int(product.installation_price * 0.085),
                        total_excluding_vat=product.price_b2c + product.installation_price,
                        total_vat=int((product.price_b2c + product.installation_price) * 0.085),
                        total_amount=int((product.price_b2c + product.installation_price) * 1.085),
                        created_at=scheduled_date,
                    )
                    session.add(invoice)
                    invoice_counter += 1

            if (i + 1) % 100 == 0:
                print(f"    Created {i + 1}/402 interventions...")

        await session.commit()

        print(f"\n  Created {jobs_created} jobs")
        print(f"  Created {orders_created} orders")
        print(f"  Created {invoice_counter - 1} invoices")

    print("\n" + "=" * 60)
    print("SEED COMPLETE!")
    print("=" * 60)
    print(f"""
Summary:
  - 4 products
  - 110 plumbers (22 Guadeloupe, 52 Martinique, 36 Guyane)
  - 341 customers
  - 402 interventions (bookings/quotes/orders/jobs)

Test Accounts:
  - Admin: admin@shattaf.fr / Admin123!
  - Sample Plumber: plumber971_1@shattaf.fr / Test123!
  - Sample Customer: customer1@example.com / Test123!
""")


if __name__ == "__main__":
    asyncio.run(seed_full_data())
