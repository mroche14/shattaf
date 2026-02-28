# 04 — Annexe : Mandat d'encaissement (encaissement pour compte de tiers)
**Entre :** {{PLUMBER_NAME}} (Bénéficiaire / Mandant) et {{PLATFORM_NAME}} (Mandataire)
**Date :** 24/01/2026

---

## 1. Objet
Le Mandant mandate le Mandataire pour **encaisser, en son nom et pour son compte**, les sommes dues par les Clients au titre des prestations d'installation réalisées par le Mandant, puis reverser les montants nets au Mandant selon les règles du Contrat cadre.

## 2. Cadre (attention réglementaire)
L'ACPR explique que si les fonds encaissés ne constituent pas un paiement dont tu es l'unique bénéficiaire et que tu dois en reverser une partie à un tiers, tu interviens dans l'exécution d'une opération de paiement ("encaissement pour compte de tiers").

➡️ **Solution retenue** : **Stripe Connect (Express)** — voir décision `01_SPEC_GLOBAL.md` §1.3 et `11_SOURCES.md`.

## 3. Flux & calendrier
- Encaissement Client via **Stripe Connect** (PaymentIntent sur le compte plateforme).
- Capture après “installation validée” (signature client), sauf litige / annulation (capture différée / manual capture).
- Reversement : transfert de la part “installation” au compte Stripe du Prestataire, puis payout vers son compte bancaire selon le calendrier du PSP.
- Déduction : la plateforme conserve la part “produit” + “commission” et peut déduire des frais PSP selon règles internes (à définir dans l’Annexe commissions).

## 4. Litiges / retours
- En cas de litige installation : gel partiel des fonds jusqu'à décision.
- Remboursements : produits vs installation séparés (règles distinctes).

## 5. Durée & fin
Alignée sur le Contrat cadre. Révocation à J+30.

## Signatures
Mandant (Prestataire) : ___________________
Mandataire (Plateforme) : __________________
