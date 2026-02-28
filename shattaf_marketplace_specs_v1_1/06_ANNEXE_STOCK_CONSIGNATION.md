# 06 — Annexe : Stock, allocation & consignation
**Date :** 24/01/2026

---

## 1. Définitions
- **Unité** : une douchette (SKU) + éventuellement un kit.
- **Consignation** : unités allouées au Prestataire, restant propriété de la Plateforme jusqu’à “consommation” (installée/vendue).
- **Traçabilité** : lot/serial + QR.

## 2. Allocation d’unités à un Prestataire
- Seuil min/max : Min = A unités, Max = B unités.
- Condition : Prestataire statut Gold + assurance valide + performance OK.
- Remise : livraison au Prestataire ou point relais.

## 3. États d’une unité
`RECEIVED -> ON_HAND -> ALLOCATED -> INSTALLED -> CLOSED`
Autres : `RETURNED`, `DAMAGED`, `LOST`.

## 4. Consommation (installation)
- Lors d’un chantier, le Prestataire scanne le QR de l’unité.
- L’unité est liée au Job (preuve : photos + signature client).
- Si unité non utilisée : retour à stock Prestataire.

## 5. Inventaires & écarts
- Inventaire mensuel (ou trimestriel) : scan de toutes les unités.
- Écarts :
  - **perte** : facturation au coût de remplacement (prix défini) + frais.
  - **casse** : selon cause (normal/négligence).
- Suspension consignation si écarts répétés.

## 6. Retours clients
- Produit non installé : retour géré par Plateforme (conditions CGV).
- Produit installé : retour produit selon règles (souvent non retournable si installé) — à définir.

## 7. Responsabilités
- Le Prestataire est gardien des unités consignées.
- La Plateforme conserve la propriété jusqu’à installation/vente.

## Annexe : barème pertes/dommages
- SKU A : X €
- SKU B : Y €
