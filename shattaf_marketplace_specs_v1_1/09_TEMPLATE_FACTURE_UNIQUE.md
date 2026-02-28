# 09 — Template facture unique (Produit + Installation)
**Date :** 24/01/2026

> Objectif : 1 facture client, 2 sections.  
> Section produit = vendeur Plateforme.  
> Section installation = prestataire Plombier, facture établie par Plateforme en qualité de mandataire.

---

## En‑tête
**FACTURE N° {INVOICE_NUMBER}**  
Date : {INVOICE_DATE}  
Client : {CUSTOMER_NAME} — {CUSTOMER_ADDRESS}  

### Émetteur (document)
{PLATFORM_NAME} — {PLATFORM_ADDRESS} — SIREN {PLATFORM_SIREN} — TVA {PLATFORM_VAT}  
**Rôle :** Vendeur (Produit) + Mandataire (Installation)

---

## A. Vente Produit (Vendeur : Plateforme)
| Désignation | Qté | PU HT | TVA | Total TTC |
|---|---:|---:|---:|---:|
| Shattaf modèle {SKU} | 1 | {P_PRICE_HT} | {P_VAT_RATE} | {P_TOTAL_TTC} |
| Kit raccords | 1 | {KIT_PRICE_HT} | {KIT_VAT_RATE} | {KIT_TOTAL_TTC} |

**Sous-total Produit TTC : {PRODUCT_SUBTOTAL_TTC}**

---

## B. Installation (Prestataire : {PLUMBER_NAME})
Prestataire : {PLUMBER_NAME} — {PLUMBER_ADDRESS} — SIREN {PLUMBER_SIREN} — TVA {PLUMBER_VAT}  

| Désignation | Qté | PU HT | TVA | Total TTC |
|---|---:|---:|---:|---:|
| Installation douchette WC | 1 | {I_PRICE_HT} | {I_VAT_RATE} | {I_TOTAL_TTC} |

**Sous-total Installation TTC : {INSTALL_SUBTOTAL_TTC}**

---

## Total
Total TTC : {TOTAL_TTC}  
Paiement : {PAYMENT_METHOD} — Référence PSP : {PSP_REFERENCE}

---

## Mentions obligatoires / protection
- **Mandat de facturation** : “La présente facture relative à l’Installation est établie par {PLATFORM_NAME} en qualité de **mandataire de facturation** du Prestataire ({PLUMBER_NAME}), au nom et pour le compte de ce dernier.” (Voir `11_SOURCES.md`.)  
- **Mandat d’encaissement** : “{PLATFORM_NAME} encaisse le paiement de la part Installation en qualité de mandataire d’encaissement pour le compte du Prestataire.”
- **Responsabilité** : “L’Installation est réalisée sous la seule responsabilité du Prestataire identifié ci‑dessus.”

## Mention TVA rénovation (si applicable)
“Le preneur certifie que les conditions d’application du taux réduit sont remplies…” (à adapter) — réforme 2025 : mention au lieu d’attestation, sous réserve de conditions (et spécificités DOM). Voir `11_SOURCES.md`.
