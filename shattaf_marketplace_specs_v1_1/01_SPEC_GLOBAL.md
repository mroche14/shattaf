# 01 — Spécification exhaustive (Business + Ops + Finance)
**Version :** v1.1 (draft)
**Date :** 24/01/2026
**Zone :** France (Guadeloupe / DOM) — B2C (clients) + B2B (plombiers indépendants)  
**Forme juridique :** à définir (EI/micro, EURL, SASU, …) — impact sur TVA/charges/compta

---

## 1. Positionnement & rôle de la plateforme
### 1.1 Rôle réel
- **Vendeur du produit** (shattaf + kits) : tu fais du e‑commerce.
- **Intermédiation / marketplace** pour l'installation : le plombier est le prestataire technique.
- **Mandataire de facturation & d'encaissement** (pour l'installation) : tu facilites l'expérience client **sans devenir le prestataire**.

### 1.2 Pourquoi un PSP marketplace est recommandé
Dès que tu encaisses une somme dont tu n'es **pas l'unique bénéficiaire** et que tu dois **reverser** une partie à un tiers, tu entres dans la logique "encaissement pour compte de tiers" (activité au sein de la chaîne de paiement). L'ACPR détaille le raisonnement et les implications (PSP/agents/exceptions).
➡️ **Recommandation MVP** : passer par un **PSP marketplace** (ex. Stripe Connect) pour encadrer l’onboarding (KYC) et les reversements, plutôt que d’encaisser puis reverser “hors PSP”. (Voir `11_SOURCES.md`.)

### 1.3 Décision PSP : Stripe Connect (Express)
**Date décision** : 24/01/2026

**Choix retenu** : **Stripe Connect** avec **comptes connectés Express** pour les plombiers.

**Objectifs** :
- Onboarding + KYC gérés par le PSP.
- Reversements “marketplace” (split/fees/payouts) gérés par le PSP.
- Intégration rapide (SDK + webhooks) et standard du marché.

**Décisions figées (tech)** :
- **Type de compte plombier** : Connect **Express** (création via API + onboarding Stripe-hosted via Account Links).
- **Flux de paiement** : **Destination charges** (PaymentIntent sur le compte plateforme) + transfert vers le compte plombier via `transfer_data[destination]`.
- **Split** : utilisation de `transfer_data[amount]` pour transférer au plombier **uniquement** la part “installation” (net de commission), et laisser le reste sur la plateforme (produit + commission).
- **Capture** : `capture_method=manual` et capture déclenchée après “installation validée” (signature client), sauf litige / annulation.

**Contraintes à connaître (MVP)** :
- La capture différée a une **fenêtre limitée** (paiements non capturés automatiquement annulés après un délai).  
  ➝ En pratique : ne pas créer/autoriser un PaymentIntent trop tôt si l’installation est planifiée loin dans le futur (voir `11_SOURCES.md`).
- “Qui est merchant of record” et les responsabilités chargeback dépendent du flux (destination charge = charge sur la plateforme).  
  ➝ À valider avec conseil + Stripe (voir `11_SOURCES.md`) et à refléter dans les CGV/CGU.

**Tarifs & délais** : voir `11_SOURCES.md` (Stripe pricing + bank deposit times).  
⚠️ Les tarifs et délais évoluent : traiter les chiffres comme **indicatifs**.

---

## 2. Business model (marge & contrôle)
### 2.1 Streams de revenus
1) **Marge produit**
- (prix vente) – (coût achat + logistique + SAV + pertes)

2) **Frais plateforme sur l'installation**
- commission %,
- frais fixe,
- ou **commission dynamique** (incitation sans fixation de prix).

3) **Options**
- créneaux premium, express, kits additionnels, upsells.

### 2.2 Contrôle de marge sans imposer le prix du plombier
Tu ne fixes pas le prix. Tu contrôles :
- le **flux** (allocation des demandes),
- la **visibilité** (statuts partenaires),
- ta **commission** (dynamique),
- la **préparation** (kits fournis → temps de pose réduit).

### 2.3 Acquisition (option) : UGC cashback
Mécanique : après installation validée, le Client publie un contenu (X/Instagram/Facebook) avec mention Oasis Shattaf + mention pub, puis reçoit un **cashback** (ex. 20 €) via **refund Stripe** (remboursement partiel sur le paiement d’origine).  
➡️ Spécification complète : `12_UGC_CASHBACK.md`.

---

## 3. Cadre facture "tiers mandaté" (facturation)
### 3.1 Factures établies par un tiers mandaté
Le BOFiP confirme la possibilité de confier l'établissement matériel des factures à un tiers au nom et pour le compte du fournisseur, via **mandat de facturation**, conclu **avant** l'émission.
➡️ En pratique marketplace : le plombier te mandate pour facturer l'installation "en son nom et pour son compte".

> Note : le BOFiP indique des modalités (contrat écrit dans certains cas, information de l'administration fiscale si facturation régulière).
(Voir `11_SOURCES.md`.)

---

## 4. TVA (Guadeloupe / DOM) + travaux rénovation
### 4.1 Taux de TVA DOM
La Guadeloupe est un **DOM** : les taux de TVA applicables peuvent différer de la métropole (taux normal/réduit/spécifique).  
➡️ À cadrer avec l’expert‑comptable (vente produit vs prestation, éventuelles exonérations, etc.). (Voir `11_SOURCES.md`.)

### 4.2 Travaux de rénovation (taux réduits)
Depuis le **01/03/2025**, l’attestation “taux réduits” est remplacée par une **mention** sur devis/facture (si conditions remplies).  
➡️ À valider au cas par cas (type de travaux/équipement, âge du logement, zone DOM). (Voir `11_SOURCES.md`.)

---

## 5. Facturation électronique (B2B) + e‑reporting — impact plateforme
- Calendrier national : obligation de **recevoir** des e‑factures au **01/09/2026** pour toutes entreprises ; obligation d’**émettre** selon taille (GE/ETI au 01/09/2026, PME/micro au 01/09/2027). (Voir `11_SOURCES.md`.)
- À anticiper : e‑facturation **B2B** + **e‑reporting** (B2C/certains flux) + spécificités DOM (biens vs services). (Voir `11_SOURCES.md`.)

---

## 6. Stock — modèles & choix recommandé
### 6.1 Modèles
A) **Vente au client** + installation facturée au nom du plombier (via mandat).
B) **Vente au plombier** (B2B) → plombier refacture produit + installation au client.
C) **Consignation** : unités allouées à un plombier (stock "chez lui") avec inventaire et traçabilité.

### 6.2 Choix MVP
- Démarrer avec A + option C (consignation) pour les plombiers "Gold" afin d'accélérer les poses.

---

## 7. Workflows (résumé)
- **Client** : réservation → paiement → planification → installation → signature → facture → SAV.
- **Plombier** : onboarding → missions → check‑in/out → photos → signature → payout.
- **Stock** : réception → allocation (consignation) → consommation (installée) → retours/pertes.

---


## Placeholders
- {{PLATFORM_NAME}} : Nom de la société plateforme
- {{PLATFORM_SIREN}} / {{PLATFORM_ADDRESS}} / {{PLATFORM_VAT}} : infos légales plateforme
- {{PLUMBER_NAME}} / {{PLUMBER_SIREN}} / {{PLUMBER_ADDRESS}} / {{PLUMBER_VAT}} : infos prestataire
- {{CUSTOMER_NAME}} / {{CUSTOMER_ADDRESS}} : infos client
- ~~{{PSP_NAME}}~~ → **Stripe Connect** (décision 24/01/2026)
- {{COMMISSION_MODEL}} : modèle de commission (fixe / % / dynamique)

---

## Références
Voir `11_SOURCES.md`.
