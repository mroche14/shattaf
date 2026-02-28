# Pack — Specs + Contrats + Factures (Marketplace Shattaf)
**Version :** v1.1 (draft) — 24/01/2026

Ce pack contient :
- les specs business & logiciel,
- les templates contractuels (plombier / mandats / consignation / CGV),
- un template de facture unique (produit + installation via mandataire),
- des annexes opérationnelles (SAV, qualité, stock, onboarding).

> ⚠️ Ces templates sont des **modèles** : fais valider par un avocat / expert‑comptable (TVA, assurances, conformité produits, paiement, clauses locales).

## Fichiers
1. `01_SPEC_GLOBAL.md` — Spécification exhaustive (business model + flux + logiciel)
2. `02_CONTRAT_PRESTATAIRE_PLOMBIER.md` — Contrat cadre (B2B)
3. `03_MANDAT_FACTURATION.md` — Mandat de facturation (annexe)
4. `04_MANDAT_ENCAISSEMENT.md` — Mandat d’encaissement (annexe)
5. `05_ANNEXE_TARIFICATION_COMMISSIONS.md` — Commission + incentives
6. `06_ANNEXE_STOCK_CONSIGNATION.md` — Allocation stock / consignation / inventaires
7. `07_ANNEXE_CHARTE_SAV_QUALITE.md` — SAV, délais, remplacements, litiges
8. `08_CGV_CLIENT_PRODUIT_ET_INSTALLATION.md` — CGV client (produit + installation via mandataire)
9. `09_TEMPLATE_FACTURE_UNIQUE.md` — Template facture (une facture, 2 sections)
10. `10_SPEC_LOGICIEL_DETAILLEE.md` — Specs logiciel détaillées (écrans + API + règles)
11. `11_SOURCES.md` — Sources réglementaires (liens officiels)
12. `12_UGC_CASHBACK.md` — Programme UGC cashback (validation contenu → remboursement)
13. `13_INSTALLATION_SIMPLE_JOBBERS_ASSURANCES.md` — Installation : pros vs jobbers + assurances (note d’analyse)


## Placeholders
- {{PLATFORM_NAME}} : Nom de la société plateforme
- {{PLATFORM_SIREN}} / {{PLATFORM_ADDRESS}} / {{PLATFORM_VAT}} : infos légales plateforme
- {{PLUMBER_NAME}} / {{PLUMBER_SIREN}} / {{PLUMBER_ADDRESS}} / {{PLUMBER_VAT}} : infos prestataire
- {{CUSTOMER_NAME}} / {{CUSTOMER_ADDRESS}} : infos client
- {{PSP_NAME}} : prestataire de paiement (choix actuel : **Stripe Connect**)
- {{COMMISSION_MODEL}} : modèle de commission (fixe / % / dynamique)
