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

`plan.md` (plan d'architecture technique, 5 phases) a été migré dans
`projet/suivi.yaml` (module `marketplace-v2`, items `roadmap-phase*`) et
supprimé du dépôt — le suivi de cette roadmap se fait désormais via Plane.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **shattaf** (3179 symbols, 7707 relationships, 230 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## When Debugging

1. `gitnexus_query({query: "<error or symptom>"})` — find execution flows related to the issue
2. `gitnexus_context({name: "<suspect function>"})` — see all callers, callees, and process participation
3. `READ gitnexus://repo/shattaf/process/{processName}` — trace the full execution flow step by step
4. For regressions: `gitnexus_detect_changes({scope: "compare", base_ref: "main"})` — see what your branch changed

## When Refactoring

- **Renaming**: MUST use `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` first. Review the preview — graph edits are safe, text_search edits need manual review. Then run with `dry_run: false`.
- **Extracting/Splitting**: MUST run `gitnexus_context({name: "target"})` to see all incoming/outgoing refs, then `gitnexus_impact({target: "target", direction: "upstream"})` to find all external callers before moving code.
- After any refactor: run `gitnexus_detect_changes({scope: "all"})` to verify only expected files changed.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Tools Quick Reference

| Tool | When to use | Command |
|------|-------------|---------|
| `query` | Find code by concept | `gitnexus_query({query: "auth validation"})` |
| `context` | 360-degree view of one symbol | `gitnexus_context({name: "validateUser"})` |
| `impact` | Blast radius before editing | `gitnexus_impact({target: "X", direction: "upstream"})` |
| `detect_changes` | Pre-commit scope check | `gitnexus_detect_changes({scope: "staged"})` |
| `rename` | Safe multi-file rename | `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` |
| `cypher` | Custom graph queries | `gitnexus_cypher({query: "MATCH ..."})` |

## Impact Risk Levels

| Depth | Meaning | Action |
|-------|---------|--------|
| d=1 | WILL BREAK — direct callers/importers | MUST update these |
| d=2 | LIKELY AFFECTED — indirect deps | Should test |
| d=3 | MAY NEED TESTING — transitive | Test if critical path |

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/shattaf/context` | Codebase overview, check index freshness |
| `gitnexus://repo/shattaf/clusters` | All functional areas |
| `gitnexus://repo/shattaf/processes` | All execution flows |
| `gitnexus://repo/shattaf/process/{name}` | Step-by-step execution trace |

## Self-Check Before Finishing

Before completing any code modification task, verify:
1. `gitnexus_impact` was run for all modified symbols
2. No HIGH/CRITICAL risk warnings were ignored
3. `gitnexus_detect_changes()` confirms changes match expected scope
4. All d=1 (WILL BREAK) dependents were updated

## Keeping the Index Fresh

After committing code changes, the GitNexus index becomes stale. Re-run analyze to update it:

```bash
npx gitnexus analyze
```

If the index previously included embeddings, preserve them by adding `--embeddings`:

```bash
npx gitnexus analyze --embeddings
```

To check whether embeddings exist, inspect `.gitnexus/meta.json` — the `stats.embeddings` field shows the count (0 means no embeddings). **Running analyze without `--embeddings` will delete any previously generated embeddings.**

> Claude Code users: A PostToolUse hook handles this automatically after `git commit` and `git merge`.

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

<!-- flotte:suivi -->
## Suivi de projet

Le suivi vit dans `projet/suivi.yaml`, versionné, appliqué par la skill globale
`plane-project-tracking`. **L'outil de suivi est une vue du dépôt, pas une source
parallèle** : quand les deux divergent, le dépôt fait foi.

À la fin d'un chantier significatif, mettre à jour le YAML puis :

```bash
export PLANE_API_KEY=...   # ~/.config/systemx/infra-secrets.local.md
python3 ~/.claude/skills/plane-project-tracking/plane_sync.py projet/suivi.yaml --diff
```

⚠️ Ne jamais recycler une `cle` : elle est l'identité de l'item côté outil, la changer
crée un doublon au lieu de renommer.
<!-- /flotte:suivi -->

<!-- flotte:secrets -->
## Secrets

Les noms des secrets sont déclarés dans `projet/secrets.yaml`. **Les valeurs vivent dans
Infisical, jamais dans le dépôt** — ni en clair, ni en exemple réaliste, ni dans un
commentaire. Pour exécuter avec les secrets injectés :

```bash
infisical run --env=dev -- <commande>
```

Ajouter un secret : le déclarer dans `projet/secrets.yaml`, puis
`~/.config/systemx/poser-secret.sh <projet> <env> <CLE> "<usage>"`.
<!-- /flotte:secrets -->
