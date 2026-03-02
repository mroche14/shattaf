# Réseau Plomb — Vision stratégique

> **Date** : mars 2026
> **Statut** : en cours de concrétisation (codebase existante à faire évoluer)

---

## 1. Le problème

Les plombiers indépendants dans les DOM manquent de :
- **Visibilité** — pas de marketing, pas de présence en ligne
- **Outils de gestion** — devis manuels, pas de suivi structuré
- **Crédibilité** — face aux entreprises établies, un indépendant inspire moins confiance
- **Flux de clients** — dépendance au bouche-à-oreille

Côté client :
- **Difficulté à trouver** un plombier disponible, compétent, proche
- **Pas de garantie qualité** sans recommandation personnelle
- **Devis opaques** — pas de référentiel de prix

---

## 2. La solution : Réseau Plomb

Une **plateforme réseau** qui connecte plombiers indépendants et clients (particuliers + pros) autour de missions de plomberie.

### Ce que la plateforme apporte aux plombiers
- Des missions entrantes sans effort commercial
- Un outil de devis assisté par IA (professionnel, rapide, structuré)
- Un process de chantier standardisé (check-in, photos, PV, signature)
- Une crédibilité réseau (profil vérifié, avis, historique)
- Des projets clé-en-main (comme Shattaf) où il suffit d'exécuter

### Ce que la plateforme apporte aux clients
- Matching avec des plombiers qualifiés à proximité
- Devis rapide et transparent
- Vérification qualité (peer review par un plombier tiers)
- Prix compétitifs (indépendants = moins de charges qu'une entreprise)

---

## 3. Les deux modes de la plateforme

### Mode A — Projets internes

La plateforme est **cliente d'elle-même**. Elle lance des campagnes commerciales standardisées.

**Exemple : Projet Shattaf**
- Vente de kits douchettes hygiéniques + installation par les plombiers du réseau
- La plateforme maîtrise : produit, prix, marketing, communication, logistique
- Les plombiers exécutent des missions standardisées (process, photos, PV)
- Modèle économique : marge produit + commission installation

**Futurs projets internes possibles** :
- Rénovation salle de bain standardisée
- Remplacement chauffe-eau
- Audit plomberie habitat
- Toute opération qui peut être packagée et commercialisée en masse

**Spécificités des projets internes** :
- Suivi marketing et communication dédié
- KPIs de campagne (taux de conversion, zones couvertes, etc.)
- La plateforme gère le stock/produit

### Mode B — Marketplace ouverte

Les clients (particuliers ou pros) postent directement des demandes de mission.

**Flow** :
1. Le client décrit son besoin (formulaire + photos)
2. L'IA aide à qualifier : type de mission, complexité estimée, budget indicatif
3. Matching avec plombiers qualifiés à proximité
4. Le(s) plombier(s) envoient un devis (assisté par IA)
5. Le client accepte → mission créée
6. Exécution : check-in, photos avant/après, PV signé
7. Vérification qualité : un plombier tiers contrôle le chantier (mission payée)
8. Paiement libéré, facture générée

**Rôle de l'IA** :
- Aide à la description du besoin (questions guidées)
- Estimation de budget (référentiel local)
- Génération de devis structuré pour le plombier
- Vérification de cohérence (matériaux, normes)

---

## 4. Système de qualité : vérification par les pairs

C'est le **différenciateur clé** de la plateforme.

### Principe
Après une intervention, un **autre plombier du réseau** est missionné pour vérifier le travail :
- Contrôle visuel (conformité, finitions)
- Test fonctionnel (étanchéité, pression)
- Photos de vérification
- Rapport validé ou signalement d'anomalie

### Pourquoi ça fonctionne
- Le vérificateur est **payé** pour cette mission → incentive à participer
- Le réseau s'auto-régule (pas de tiers extérieur coûteux)
- Les plombiers de qualité accumulent un historique positif
- Les clients ont une **double garantie** (exécutant + vérificateur)

### Règles
- Le vérificateur ne peut pas être le même que l'exécutant
- Il doit être dans la même zone géographique
- La vérification est une mission à part entière (payée, tracée, facturée)

---

## 5. Positionnement prix

**Argument** : les plombiers indépendants ont moins de charges qu'une entreprise de plomberie établie (pas de locaux, pas de salariés, pas de flotte). La plateforme leur apporte ce qu'une entreprise apporte (flux, crédibilité, outils) pour une commission bien inférieure aux charges d'une structure.

**Résultat** : prix client inférieur aux entreprises, revenu plombier supérieur au salariat.

---

## 6. Modèle économique

| Source | Projets internes | Marketplace |
|--------|-----------------|-------------|
| Marge produit | ✅ (vente de produits) | ❌ |
| Commission installation | ✅ (% sur mission) | ✅ (% sur mission) |
| Frais de mise en relation | ❌ | ✅ (fixe ou %) |
| Mission vérification | ✅ (facturée au projet) | ✅ (facturée au client ou intégrée) |
| Options premium | ✅ (express, garantie étendue) | ✅ (idem) |

---

## 7. Roadmap technique

### Phase actuelle (mars 2026) — Fondations réseau
Ce qui existe déjà et sert directement Réseau Plomb :
- ✅ Backend FastAPI + PostgreSQL avec modèles User, PlumberProfile, Booking, Order, Job, Invoice
- ✅ Matching géographique (algorithme scoring proximité/qualité/charge)
- ✅ Carte de couverture avec zones mortes
- ✅ Pipeline prospects (2000+ plombiers identifiés, CRM intégré)
- ✅ Simulation matching (test arbitraire)
- ✅ Dashboard admin avec KPIs activité + prospects
- ✅ Portail client, PWA plombier, backoffice admin

### Phase suivante — Généralisation
- [ ] Ajouter l'entité `Project` (Shattaf = premier projet)
- [ ] Ouvrir le flow "demande libre" côté client (pas lié à un produit)
- [ ] Module IA d'aide au devis
- [ ] Workflow de vérification par les pairs
- [ ] Renommer le repo/domaine → réseau-plomb

### Phase horizon — Scale
- [ ] IA qualification de besoin (NLP + photos)
- [ ] Onboarding plombier self-service (upload attestations, vérification auto)
- [ ] Expansion géographique (974, métropole)
- [ ] Programmes de fidélité plombier (statuts, bonus)
- [ ] Facturation électronique B2B (obligation 09/2026)

---

## 8. Relation avec le projet Shattaf

Shattaf **ne disparaît pas**. Il devient le **premier projet interne** de la plateforme Réseau Plomb.

| Avant | Après |
|-------|-------|
| Shattaf = le produit entier | Shattaf = un projet sur la plateforme |
| L'app s'appelle Shattaf | L'app s'appelle Réseau Plomb |
| Plombier = installateur de shattaf | Plombier = membre du réseau |
| Client = acheteur de shattaf | Client = demandeur de mission |

La documentation Shattaf existante (`shattaf_marketplace_specs_v1_1/`) reste valide comme specs du projet Shattaf. Les contrats, mandats, CGV s'appliquent dans le cadre de ce projet spécifique.

---

## 9. Glossaire Réseau Plomb

| Terme | Définition |
|-------|-----------|
| **Réseau Plomb** | La plateforme (nom de travail) |
| **Projet interne** | Campagne commerciale pilotée par la plateforme (ex: Shattaf) |
| **Mission** | Unité de travail : une intervention plomberie |
| **Devis** | Proposition chiffrée du plombier pour une mission |
| **Vérification** | Mission de contrôle qualité par un plombier tiers |
| **Prospect** | Plombier identifié mais pas encore inscrit au réseau |
| **Membre** | Plombier actif dans le réseau |
