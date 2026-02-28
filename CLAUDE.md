# Shattaf Marketplace Platform

## Project Overview

Shattaf is a marketplace platform for bidet (shattaf) installation services in French overseas departments (Guadeloupe, Martinique, Guyane). The platform connects customers with certified plumbers for product purchase and professional installation.

## Architecture

**Monorepo** using pnpm workspaces + Turborepo

```
shattaf/
├── apps/
│   ├── api/           # FastAPI Python backend (port 8010)
│   ├── web-client/    # Customer portal - React (port 3003)
│   ├── web-pro/       # Plumber PWA - React (port 3001)
│   └── web-admin/     # Admin backoffice - React (port 3002)
├── packages/
│   ├── shared-types/  # Shared TypeScript types
│   ├── ui-kit/        # Shared UI components
│   └── api-client/    # Generated API client
├── web_src/           # Landing page (existing)
└── docs/              # Business documentation
```

## Tech Stack

- **Backend**: FastAPI, SQLModel, PostgreSQL, Alembic
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, React Query, Zustand
- **Integrations**: Stripe Connect, Google Maps, Brevo (SMS/Email), S3/R2

## Key Concepts

### User Roles
- `customer` - End users booking installations
- `plumber` - Certified installers (by department: 971, 972, 973)
- `admin` - Platform administrators

### Business Flow
1. Customer creates booking (location, photos, toilet type)
2. Matching algorithm finds nearby plumbers
3. Plumber sends quote
4. Customer accepts and pays (Stripe split payment)
5. Plumber executes job (check-in, photos, signature)
6. Invoice generated with mandataire mentions (BOFiP compliant)

### Departments
- `971` - Guadeloupe (primary)
- `972` - Martinique
- `973` - Guyane

## Development Commands

```bash
# Install dependencies
pnpm install

# Start all apps in dev mode
pnpm dev

# Start specific app
pnpm dev --filter=web-client
pnpm dev --filter=web-pro
pnpm dev --filter=web-admin

# Backend (separate terminal)
cd apps/api
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8010

# Database migrations
cd apps/api
alembic upgrade head
alembic revision --autogenerate -m "description"

# Build all
pnpm build

# Type check
pnpm typecheck
```

## Environment Setup

1. Copy `.env.example` to `.env` in project root
2. Copy `.env.example` to `apps/api/.env`
3. Fill in required values (database, Stripe keys, etc.)

## API Endpoints

All endpoints prefixed with `/api/v1/`

- `/auth/*` - Authentication (register, login, refresh)
- `/users/*` - User profiles
- `/products/*` - Product catalog
- `/bookings/*` - Customer reservations
- `/quotes/*` - Plumber quotes
- `/orders/*` - Orders with payment
- `/jobs/*` - Mission execution
- `/invoices/*` - Invoice generation
- `/payments/*` - Stripe webhooks
- `/admin/*` - Admin operations

## Database Models

Key models in `apps/api/src/models/`:
- `User` - Base user with role
- `CustomerProfile` - Customer details
- `PlumberProfile` - Plumber with department, intervention zones
- `Booking` - Reservation with location/photos
- `Quote` - Plumber price proposal
- `Order` - Confirmed order with payment
- `Job` - Field mission execution
- `Invoice` - Generated invoice

## Admin Features

The admin interface (`web-admin`) provides:
- Dashboard with stats by department
- Coverage map (Leaflet) showing plumber locations
- Plumber management (status, department, intervention zones)
- Matching simulation and visualization
- Full tracking of all entities
- Audit logs

## Code Conventions

- Backend: Python 3.11+, type hints, async/await
- Frontend: TypeScript strict, functional components
- Styling: Tailwind CSS with custom design tokens
- State: Zustand for local, React Query for server state
- Forms: React Hook Form + Zod validation

## Documentation

Full architecture plan: `~/.claude/plans/shattaf-marketplace-architecture.md`
