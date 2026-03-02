# Plan d'architecture — Réseau Plomb

> Ce document décrit les évolutions techniques pour transformer la codebase Shattaf en plateforme Réseau Plomb.
> Vision complète : `docs/VISION.md`

---

## État actuel (mars 2026)

La codebase implémente le **projet Shattaf** avec :
- Backend FastAPI + PostgreSQL (users, plumbers, bookings, orders, jobs, invoices, products)
- Matching géographique (algorithme scoring proximité/qualité/charge)
- Carte de couverture avec zones mortes (plombiers + prospects)
- Pipeline prospects CRM (2000+ plombiers identifiés)
- Dashboard admin avec KPIs activité + prospects
- 3 frontends : client (web-client), plombier (web-pro), admin (web-admin)

---

## Phase 1 — Entité Project (Shattaf = premier projet)

### Objectif
Introduire la notion de `Project` pour que Shattaf devienne un projet interne parmi d'autres.

### Modèle

```python
class Project(SQLModel, table=True):
    id: UUID
    name: str                       # "Shattaf Douchettes"
    slug: str                       # "shattaf"
    type: ProjectType               # "internal" | "marketplace"
    status: ProjectStatus           # "draft" | "active" | "paused" | "archived"
    description: Optional[str]
    department: Optional[str]       # scope géographique (null = tous)

    # Projets internes : la plateforme gère le marketing
    marketing_config: Optional[dict]  # tracking, comm, campagne

    created_at: datetime
    updated_at: datetime
```

### Impact
- `Product` reçoit un FK `project_id` (les produits Shattaf sont liés au projet Shattaf)
- `Booking` reçoit un FK `project_id` (les réservations sont liées à un projet ou null pour marketplace libre)
- Migration : créer le projet Shattaf, lier les produits/bookings existants

---

## Phase 2 — Flow "demande libre" (marketplace ouverte)

### Objectif
Permettre à un client de poster une demande de mission **sans passer par un produit**.

### Nouveau flow
1. Client remplit un formulaire de besoin :
   - Type de travaux (dropdown catégorisé)
   - Description libre + photos
   - Localisation
   - Urgence (normal / express)
2. La demande crée un `Booking` avec `project_id = null` et `type = 'marketplace'`
3. Le matching propose des plombiers proches
4. Le plombier envoie un devis (Quote)
5. Client accepte → Order → Job → Invoice

### Impact
- `Booking` : ajouter `type: 'product' | 'marketplace'`
- `Booking` : ajouter `category: str` (type de travaux)
- Nouveau composant `web-client` : formulaire de demande libre

---

## Phase 3 — IA aide au devis

### Objectif
Assister le plombier dans la rédaction de devis professionnels.

### Approche
- Input : description du besoin + photos + catégorie + localisation
- Output : devis structuré (lignes de poste, matériaux, main d'œuvre, total)
- Le plombier peut modifier avant envoi
- Référentiel de prix local (construit à partir de l'historique des missions)

### Impact
- Nouveau service `apps/api/src/services/ai_devis.py`
- Appel LLM (Claude API) avec contexte métier
- Endpoint POST `/api/v1/quotes/ai-draft`
- Composant `web-pro` : interface de devis assisté

---

## Phase 4 — Vérification par les pairs

### Objectif
Après une intervention, un plombier tiers vérifie le travail.

### Modèle

```python
class Verification(SQLModel, table=True):
    id: UUID
    job_id: UUID                    # FK → Job vérifié
    verifier_plumber_id: UUID       # FK → PlumberProfile (différent de l'exécutant)
    status: VerificationStatus      # "pending" | "in_progress" | "approved" | "rejected"

    # Contrôle
    checklist: dict                 # items vérifiés (étanchéité, conformité, finitions)
    photos: List[str]              # photos de vérification
    notes: Optional[str]

    # Résultat
    approved: Optional[bool]
    issues: Optional[List[dict]]   # anomalies signalées

    completed_at: Optional[datetime]
    created_at: datetime
```

### Flow
1. Job terminé → Verification créée automatiquement
2. Matching : trouver un plombier vérificateur (même zone, pas le même)
3. Le vérificateur accepte la mission de vérification
4. Il se déplace, contrôle, photographie, remplit le rapport
5. Si approuvé → paiement libéré à l'exécutant
6. Si rejeté → process de résolution (re-intervention)

### Impact
- Nouveau modèle `Verification`
- Extension du matching : mode "vérification" (exclure l'exécutant)
- Nouveau statut Job : `pending_verification`
- Endpoint `/api/v1/verifications/*`
- Composant `web-pro` : interface de vérification

---

## Phase 5 — Renaming & branding

### Objectif
Renommer le projet de Shattaf à Réseau Plomb.

### Actions
- Renommer le repo : `shattaf` → `reseau-plomb`
- Mettre à jour les titres/logos dans les 3 frontends
- Garder "Shattaf" uniquement dans le contexte du projet interne
- Mettre à jour les configs (package.json, docker, etc.)

> Note : cette phase est indépendante et peut être faite à tout moment.

---

## Fichiers impactés (résumé)

| Phase | Backend | Frontend | Priorité |
|-------|---------|----------|----------|
| 1. Project entity | Nouveau modèle + migration + FKs | Admin: gestion projets | Haute |
| 2. Demande libre | Booking type + category | Client: formulaire | Haute |
| 3. IA devis | Service AI + endpoint | Pro: interface devis | Moyenne |
| 4. Peer review | Modèle Verification + matching | Pro: interface vérif | Moyenne |
| 5. Renaming | Config | Tous les frontends | Basse |

---

## Ce qui ne change PAS

- Le matching géographique et l'algo de scoring
- La carte de couverture et les zones mortes
- Le pipeline prospects (recrutement plombiers)
- Le système de paiement Stripe Connect
- Les contrats/mandats/CGV Shattaf (ils s'appliquent au projet Shattaf)
- Le process d'exécution terrain (check-in, photos, signature)
