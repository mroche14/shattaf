# Réseau Plomb — Plateforme réseau plombiers

## Vision

**Réseau Plomb** est une plateforme de mise en réseau de plombiers indépendants dans les DOM (Guadeloupe, Martinique, Guyane). Elle connecte plombiers, clients particuliers et clients professionnels autour de missions de plomberie.

La plateforme opère sur **deux modes** :

### Mode 1 — Projets internes (la plateforme est cliente d'elle-même)
- Des campagnes de vente standardisées (ex : **Shattaf** = douchettes hygiéniques)
- La plateforme contrôle le produit, le prix, le marketing, la communication
- Les plombiers du réseau exécutent les missions
- Inclut du suivi marketing, de la communication projet, de la logistique

### Mode 2 — Marketplace ouverte (clients → plombiers)
- Un particulier ou un professionnel poste une demande de mission
- L'IA aide à qualifier le besoin, structurer le devis, estimer le budget
- Le matching connecte avec les plombiers qualifiés à proximité
- Vérification qualité par un plombier tiers (peer review = mission payée)

### Proposition de valeur pour les plombiers
- Professionnalisation massive : devis IA, process structuré, documentation chantier
- Visibilité sans effort marketing personnel
- Missions clé-en-main (projets internes) + flux client direct (marketplace)
- Coût inférieur aux entreprises établies → avantage prix pour les clients

## Projet Shattaf (premier projet interne)

Shattaf est le **premier projet interne** de Réseau Plomb :
- Vente de kits douchettes hygiéniques + installation professionnelle
- Marchés : Guadeloupe (971), Martinique (972), Guyane (973)
- Specs complètes : `shattaf_marketplace_specs_v1_1/`
- Le code actuel implémente principalement ce projet

## Architecture

**Monorepo** pnpm workspaces + Turborepo

```
shattaf/                          # repo actuel (sera renommé reseau-plomb/)
├── apps/
│   ├── api/                      # FastAPI Python backend (port 8010)
│   ├── web-client/               # Portail client - React (port 3003)
│   ├── web-pro/                  # PWA Plombier - React (port 3001)
│   └── web-admin/                # Backoffice admin - React (port 3002)
├── packages/
│   ├── shared-types/             # Types TypeScript partagés
│   ├── ui-kit/                   # Composants UI partagés
│   └── api-client/               # Client API généré
├── docs/                         # Documentation business & légale
│   ├── VISION.md                 # Vision stratégique Réseau Plomb
│   └── ...                       # Guides juridiques, études, sources
├── shattaf_marketplace_specs_v1_1/  # Specs projet Shattaf (contrats, factures, CGV)
└── web_src/                      # Landing page
```

## Tech Stack

- **Backend**: FastAPI, SQLModel, PostgreSQL, Alembic
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, React Query, Zustand
- **Intégrations**: Stripe Connect, Google Maps/BAN, Brevo (SMS/Email), S3/R2
- **IA** (à implémenter): Aide au devis, qualification de besoin

## Modèle de données

### Entités réseau (platform-level)
- `User` — Compte utilisateur (role: customer, plumber, admin)
- `PlumberProfile` — Profil plombier (lifecycle complet: prospect → pending → active)
- `CustomerProfile` — Profil client

### Entités mission
- `Booking` — Demande de mission client (localisation, photos, type)
- `Quote` — Devis plombier
- `Order` — Mission confirmée + paiement (Stripe split)
- `Job` — Exécution terrain (check-in, photos, signature)
- `Invoice` — Facture (mentions mandataire BOFiP)

### Entités projet Shattaf
- `Product` — Catalogue produits
- `PricingConfig` — Configuration tarification

### Admin
- `AuditLog` — Journal d'audit
- Prospects = PlumberProfile avec `status='prospect'` (pipeline CRM intégré)

## Rôles utilisateur

- `customer` — Client final (particulier ou pro)
- `plumber` — Plombier indépendant du réseau
- `admin` — Administrateur plateforme

## Départements cibles

- `971` — Guadeloupe (marché primaire)
- `972` — Martinique
- `973` — Guyane

## Commandes de développement

```bash
pnpm install                              # Installer les dépendances
pnpm dev                                  # Démarrer tout en dev
pnpm dev --filter=web-admin               # Démarrer une app spécifique

# Backend
cd apps/api
source venv/bin/activate
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8010

# Migrations
cd apps/api
alembic upgrade head
alembic revision --autogenerate -m "description"

pnpm build                                # Build
pnpm typecheck                            # Type check
```

## Setup environnement

1. Copier `.env.example` → `.env` (racine)
2. Copier `.env.example` → `apps/api/.env`
3. Remplir les valeurs (database, Stripe, etc.)

## Endpoints API

Préfixe : `/api/v1/`

- `/auth/*` — Authentification
- `/users/*` — Profils
- `/products/*` — Catalogue produits (projet Shattaf)
- `/bookings/*` — Demandes de mission
- `/quotes/*` — Devis plombier
- `/orders/*` — Missions confirmées + paiement
- `/jobs/*` — Exécution terrain
- `/invoices/*` — Facturation
- `/payments/*` — Webhooks Stripe
- `/admin/*` — Opérations admin (stats, couverture, matching, prospects)

## Admin Backoffice (web-admin)

Centre de commande du réseau :
- **Dashboard** — KPIs activité (gauche) + prospects (droite)
- **Carte de couverture** — Plombiers, réservations, prospects, zones mortes
- **Zones mortes** — Source configurable (plombiers / prospects / combiné)
- **Simulation matching** — Test depuis point arbitraire ou adresse
- **Pipeline prospects** — CRM (2000+ prospects, filtres par type/téléphone/email)
- **Gestion plombiers** — Statuts, départements, zones d'intervention

## Conventions de code

- Backend: Python 3.11+, type hints, async/await
- Frontend: TypeScript strict, composants fonctionnels
- Styling: Tailwind CSS avec design tokens custom
- État: Zustand pour local, React Query pour serveur
- Formulaires: React Hook Form + Zod

## Documentation

| Document | Contenu |
|----------|---------|
| `docs/VISION.md` | Vision stratégique Réseau Plomb (deux modes, peer review, roadmap) |
| `docs/reseau-installateurs-shattaf.md` | Guide juridique/opérationnel réseau installateurs |
| `shattaf_marketplace_specs_v1_1/` | Specs complètes projet Shattaf (contrats, mandats, CGV, factures) |
| `docs/sources-plombiers-dom.md` | Sources de données plombiers DOM |
| `plan.md` | Plan d'architecture technique |
