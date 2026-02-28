# 10 — Spécification logicielle détaillée (écrans + API + règles)
**Version :** v1.1 (draft)
**Date :** 24/01/2026

---

## 1. Produits (SKU) & conformité
### Écrans admin
- Catalogue produits (CRUD)
- Certifications & documents (upload)
- Prix (B2C/B2B), TVA, bundles (kit)
- Paramètres : "éligible consignation", "éligible express"

### API (exemples)
- `GET /products`
- `POST /products`
- `POST /products/:id/documents`
- `PATCH /products/:id/pricing`

---

## 2. Stock & consignation
### Écrans admin / entrepôt
- Réception (scan lot/serial, création unités)
- Transfert entrepôts
- Allocation consignation à un plombier
- Inventaire (scan + écarts)
- Retours / casse / perte

### Écrans plombier (PWA)
- "Mon stock" (unités consignées)
- Scanner QR : "utiliser pour mission"
- Déclarer casse/perte (avec photo)

### API
- `POST /inventory/receive`
- `POST /inventory/allocate` (plumber_id, unit_ids)
- `POST /inventory/consume` (job_id, unit_id)
- `POST /inventory/audit` (scans)
- `POST /inventory/report-loss`

---

## 3. Réservation client (booking)
### Écran client (web)
Champs obligatoires :
- adresse + géocodage
- téléphone/email
- photos WC (au moins 2 angles)
- type WC (posé/suspendu), accès robinet d'arrêt (oui/non)
- notes accès (étage, parking, digicode)
- créneau souhaité

Règles :
- validation taille photo / format
- consentement partage données au plombier
- checklist prérequis (affichée)

### API
- `POST /bookings`
- `POST /bookings/:id/photos`
- `GET /bookings/:id`

---

## 4. Matching & devis
### Modes
- Assignation directe (meilleur plombier)
- Appel d'offres (3 plombiers → 1 choisi)

### Scoring (exemple)
Score = 0.35*distance + 0.25*dispo + 0.2*rating + 0.2*compétitivité

### Limites légales intégrées
- Prix recommandé affiché, mais plombier propose prix final.
- Pas de contrainte horaire imposée (disponibilités déclaratives).

### API
- `POST /matching/run` (booking_id)
- `POST /quotes` (plumber_id, install_price, vat_rate)
- `POST /quotes/:id/accept`

---

## 5. Paiement & split
### PSP marketplace : Stripe Connect (Express)
**Décision** : voir 01_SPEC_GLOBAL.md §1.3

**Architecture Stripe Connect** :
- **Compte plateforme** : compte Stripe principal (la plateforme)
- **Comptes connectés (Express)** : un compte par plombier, KYC géré par Stripe
- **Flow figé** : **destination charges** (PaymentIntent sur la plateforme, transfert vers compte plombier). (Voir `11_SOURCES.md`.)

**Décision capture** :
- `capture_method=manual` (paiement autorisé puis capturé après “installation validée”). (Voir `11_SOURCES.md`.)
- ⚠️ Délai de capture limité → créer/autoriser le PaymentIntent au plus près de l’intervention si l’installation est planifiée loin dans le futur.

**Décision split** :
- `transfer_data[destination] = {plumber_stripe_account_id}`
- `transfer_data[amount] = {plumber_payout_amount}`  
  ➝ permet de **ne transférer que l’installation** (net de commission), et de laisser sur la plateforme le reste (produit + commission).

**Split automatique (illustration)** :
```
Client paie €150 (TTC)
  ├─ Transfert au plombier (payout) : €80
  ├─ Solde plateforme (produit + commission) : €70
  └─ Frais PSP : selon carte/pays
```

**Payouts** :
- Plombiers : automatique selon calendrier Stripe (délai variable ; dépend pays/historique/risque)
- Plateforme : selon calendrier Stripe

**Frais** :
- Dépendent du pays, du type de paiement et du modèle Connect retenu. Références : voir `11_SOURCES.md`.

### API
- `POST /orders` (booking_id, quote_id, cart)
- `POST /payments/create-intent` → Stripe PaymentIntent
- `POST /payments/capture` → capture PaymentIntent (après job complete)
- `POST /stripe/connect/onboard` → génère lien onboarding plombier
- Webhooks Stripe : `POST /webhooks/stripe`
  - `payment_intent.succeeded` / `payment_intent.amount_capturable_updated`
  - `account.updated` (KYC plombier)
  - `payout.paid`

---

## 6. Chantier (job execution)
### App plombier
- "Arrivé sur place" (check‑in)
- photos avant
- scan unité (si consignation)
- "Terminé" + photos après
- signature client (canvas)
- commentaire

### API
- `POST /jobs/:id/checkin`
- `POST /jobs/:id/photos`
- `POST /jobs/:id/signature`
- `POST /jobs/:id/complete`

---

## 7. Facturation
### Règles
- Générer un PDF "facture unique"
- Section B (installation) : mentions mandataire (BOFiP) — voir `11_SOURCES.md`
- B2B : anticiper e‑facturation + e‑reporting (calendrier national + spécificités DOM) — voir `11_SOURCES.md`

### API
- `POST /invoices/generate` (order_id)
- `GET /invoices/:id/pdf`

---

## 8. SAV & litiges
### Écrans
- Client : ouvrir ticket + upload media
- Admin : triage produit vs installation
- Plombier : traiter ticket installation

### Règles
- Si ticket installation : assigner au plombier initial
- Si remplacement : créer nouveau job + historiser

### API
- `POST /tickets`
- `PATCH /tickets/:id`
- `POST /refunds` (produit vs installation)

---

## 9. RBAC & audit
- Journal immuable : stock moves, paiements, factures, mandats, changements de prix.
- MFA admin.

---

## 10. UGC cashback (marketing)
Voir `12_UGC_CASHBACK.md` (spécification complète).

### Écrans client
- Offre UGC (éligibilité + règles + CTA)
- Générateur de contenu (templates / IA)
- Soumission preuves (lien + upload)
- Suivi statut (pending/approved/rejected/refunded)

### Écrans admin
- Queue demandes UGC
- Review (preuves + approve/reject)

### API
- `POST /ugc/submissions`
- `GET /ugc/submissions/me`
- `GET /admin/ugc/submissions`
- `POST /admin/ugc/submissions/:id/approve`
- `POST /admin/ugc/submissions/:id/reject`
- `POST /admin/ugc/submissions/:id/refund` → refund partiel Stripe
