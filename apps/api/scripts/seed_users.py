#!/usr/bin/env python3
"""Seed script to create test user accounts."""

import asyncio
import os
import sys
from pathlib import Path

# Set up proper module paths
api_root = Path(__file__).parent.parent
sys.path.insert(0, str(api_root))
os.chdir(api_root)

# Now import as a package
from src.database import init_db
from src.services.auth import AuthService
from src.models import User, UserRole


TEST_USERS = [
    {
        "email": "customer@test.com",
        "phone": "+590690000001",
        "password": "Test123!",
        "first_name": "Marie",
        "last_name": "Dupont",
        "role": UserRole.CUSTOMER,
    },
    {
        "email": "plumber@test.com",
        "phone": "+590690000002",
        "password": "Test123!",
        "first_name": "Jean",
        "last_name": "Martin",
        "role": UserRole.PLUMBER,
    },
    {
        "email": "admin@test.com",
        "phone": "+590690000003",
        "password": "Admin123!",
        "first_name": "Admin",
        "last_name": "Shattaf",
        "role": UserRole.ADMIN,
    },
]


async def seed_users():
    """Create test user accounts."""
    print("\n🌱 Seeding test users...\n")

    # Initialize database
    await init_db()

    # Import the session factory after init
    from src import database

    async with database.async_session_factory() as session:
        auth_service = AuthService(session)

        for user_data in TEST_USERS:
            # Check if user already exists
            existing = await auth_service.get_user_by_email(user_data["email"])
            if existing:
                print(f"  ⚠ User {user_data['email']} already exists, skipping...")
                continue

            # Create user
            hashed_password = AuthService.hash_password(user_data["password"])
            user = User(
                email=user_data["email"],
                phone=user_data["phone"],
                hashed_password=hashed_password,
                first_name=user_data["first_name"],
                last_name=user_data["last_name"],
                role=user_data["role"],
                is_active=True,
                is_verified=True,  # Pre-verify test accounts
            )
            session.add(user)
            await session.flush()

            # Create profile based on role
            if user_data["role"] == UserRole.PLUMBER:
                from src.models import PlumberProfile, PlumberStatus
                profile = PlumberProfile(
                    user_id=user.id,
                    status=PlumberStatus.ACTIVE,
                    service_area_radius_km=30.0,
                    years_experience=5,
                )
                session.add(profile)
            elif user_data["role"] == UserRole.CUSTOMER:
                from src.models import CustomerProfile
                profile = CustomerProfile(user_id=user.id)
                session.add(profile)

            print(f"  ✓ Created {user_data['role'].value}: {user_data['email']}")

        await session.commit()

    print("\n" + "=" * 50)
    print("📋 TEST ACCOUNTS CREATED:")
    print("=" * 50)
    print()
    print("🛒 CUSTOMER (web-client):")
    print("   Email:    customer@test.com")
    print("   Password: Test123!")
    print()
    print("🔧 PLUMBER (web-pro):")
    print("   Email:    plumber@test.com")
    print("   Password: Test123!")
    print()
    print("👑 ADMIN (web-admin):")
    print("   Email:    admin@test.com")
    print("   Password: Admin123!")
    print()
    print("=" * 50)
    print("✅ Seed complete!")
    print()


if __name__ == "__main__":
    asyncio.run(seed_users())
