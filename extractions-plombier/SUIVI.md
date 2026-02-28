# Suivi Extraction Plombiers DOM

**Dernière mise à jour** : 2026-01-26

---

## Statut Global

| Département | Source SIRENE | Pages Jaunes | Téléphone | SIREN | CSV Final |
|-------------|---------------|--------------|-----------|-------|-----------|
| 971 - Guadeloupe | ✅ 577 entrées | ✅ 115 pros | 83% | 72% | ✅ |
| 972 - Martinique | ✅ 423 entrées | ✅ 74 pros | 89% | 71% | ✅ |
| 973 - Guyane | ✅ 237 entrées | ✅ 43 pros | 81% | 72% | ✅ |
| 974 - La Réunion | ✅ 546 entrées | ✅ 134 pros | 85% | 76% | ✅ |

**Total SIRENE** : 1783 établissements (code APE 43.22A uniquement)
**Total Pages Jaunes** : 366 professionnels avec données enrichies
**Total Google Maps** : 283 plombiers (100% avec téléphone) - scraping exhaustif v2
**Total Final (dédupliqué + enrichi)** : 2027 plombiers uniques

### Couverture Données Clés
| Donnée | Nombre | Couverture |
|--------|--------|------------|
| Téléphone | 443 | 21.9% |
| SIREN | 1888 | 93.1% |
| Individuel (EI) | 1153 | 57% |
| Société (SARL/SAS) | 695 | 34% |
| Non classifié | 179 | 9% |

---

## TODO Liste

### Phase 1 : Extraction SIRENE (Source officielle)

| # | Tâche | Statut | Blocage | Solution |
|---|-------|--------|---------|----------|
| 1.1 | Extraire 971 via annuaire-entreprises.data.gouv.fr | ✅ FAIT | - | Playwright MCP |
| 1.2 | Extraire 972 via annuaire-entreprises.data.gouv.fr | ✅ FAIT | - | Playwright MCP |
| 1.3 | Extraire 973 via annuaire-entreprises.data.gouv.fr | ✅ FAIT | - | Playwright MCP |
| 1.4 | Extraire 974 via annuaire-entreprises.data.gouv.fr | ✅ FAIT | - | Playwright MCP |

**Filtres à appliquer** :
- Code APE : 43.22A (Travaux d'installation d'eau et de gaz)
- Code APE : 43.22B (Travaux d'installation d'équipements thermiques)
- Etat : En activité uniquement
- Localisation : Département 971/972/973/974

### Phase 2 : Enrichissement Coordonnées via Pages Jaunes

| # | Tâche | Statut | Résultat |
|---|-------|--------|----------|
| 2.1 | Scraper Pages Jaunes 971 | ✅ FAIT | 115 pros - 83% tél, 72% SIREN |
| 2.2 | Scraper Pages Jaunes 972 | ✅ FAIT | 74 pros - 89% tél, 71% SIREN |
| 2.3 | Scraper Pages Jaunes 973 | ✅ FAIT | 43 pros - 81% tél, 72% SIREN |
| 2.4 | Scraper Pages Jaunes 974 | ✅ FAIT | 134 pros - 85% tél, 76% SIREN |
| 2.5 | Croiser avec societe.com | NON NÉCESSAIRE | Toutes infos via Pages Jaunes |

**Script** : `scripts/scrape_pj_playwright.py`

**Commande** :
```bash
source .venv/bin/activate
python3 scripts/scrape_pj_playwright.py --departement 971 --headed
```

**Données extraites** (exhaustif) :
- Nom, activités, adresse complète (CP, ville, département)
- Téléphones (jusqu'à 2), présence formulaire email
- Site web, horaires complets (7j/7)
- Moyens de paiement (CB, Espèces, Virement...)
- Prestations/services, produits
- Zone d'intervention, description
- SIREN, SIRET, code NAF
- Date création, effectif, type établissement
- Note Pages Jaunes, nombre d'avis

**Performance test 971** :
- 20 pros/page, ~115 résultats total
- 60% avec téléphone, 50% avec SIREN
- 40% avec horaires, 50% avec prestations

### Phase 3 : Agrégation & Déduplication

| # | Tâche | Statut | Blocage | Solution |
|---|-------|--------|---------|----------|
| 3.1 | Fusionner tous les CSV bruts | ✅ FAIT | - | Script aggregate.py avec mapping colonnes |
| 3.2 | Dédupliquer par SIREN | ✅ FAIT | - | Clé unique SIREN + similarité nom |
| 3.3 | Normaliser téléphones/emails | ✅ FAIT | - | Script utils.py |
| 3.4 | Valider échantillon 10% | A FAIRE | - | Vérification manuelle |
| 3.5 | Export CSV final | ✅ FAIT | - | processed/plombiers_final.csv |

**Résultat agrégation** :
- **1880 enregistrements uniques** (2149 bruts avant déduplication)
- **184 entrées fusionnées** (SIRENE + Pages Jaunes via SIREN commun)
- Répartition : 971 (556), 972 (410), 973 (237), 974 (529), sans CP (148)

---

## Blocages Actuels

### 1. Export SIRENE via Interface Web
**Problème** : L'interface annuaire-entreprises.data.gouv.fr nécessite de remplir des filtres manuellement.

**Solution en cours** :
- Remplir le formulaire via Playwright
- Sélectionner localisation (971, 972, 973, 974)
- Sélectionner code APE (43.22A, 43.22B)
- Télécharger le CSV généré

### 2. Limite API SIRENE INSEE
**Problème** : L'API INSEE nécessite un token et a des limites de requêtes.

**Solution** :
- Créer un compte sur api.insee.fr (gratuit)
- Demander accès API SIRENE
- Utiliser le token dans les scripts

### 3. Anti-scraping Pages Jaunes
**Problème** : Pages Jaunes détecte et bloque les bots.

**Solution** :
- Délai entre requêtes (2-5 secondes)
- User-Agent réaliste
- Rotation IP si nécessaire (proxies)

---

## Fichiers Bruts Collectés

| Fichier | Source | Département | Nb entrées | Date |
|---------|--------|-------------|------------|------|
| sirene_971.csv | annuaire-entreprises.data.gouv.fr | 971 - Guadeloupe | 577 | 2026-01-25 |
| sirene_972.csv | annuaire-entreprises.data.gouv.fr | 972 - Martinique | 423 | 2026-01-25 |
| sirene_973.csv | annuaire-entreprises.data.gouv.fr | 973 - Guyane | 237 | 2026-01-25 |
| sirene_974.csv | annuaire-entreprises.data.gouv.fr | 974 - La Réunion | 546 | 2026-01-25 |

*Filtré sur code APE 43.22A uniquement (originaux avec 43.22B sauvegardés en `*_original.csv`)*

| Fichier | Source | Département | Nb entrées | Date |
|---------|--------|-------------|------------|------|
| pagesjaunes_971.csv | Pages Jaunes | 971 - Guadeloupe | 115 | 2026-01-25 |
| pagesjaunes_972.csv | Pages Jaunes | 972 - Martinique | 74 | 2026-01-25 |
| pagesjaunes_973.csv | Pages Jaunes | 973 - Guyane | 43 | 2026-01-25 |
| pagesjaunes_974.csv | Pages Jaunes | 974 - La Réunion | 134 | 2026-01-25 |

*Total Pages Jaunes : 366 professionnels avec données exhaustives (téléphones, horaires, SIREN, prestations, etc.)*

---

## Exploration Sources Additionnelles (2026-01-25)

### Sources Testées

| Source | Statut | Résultat |
|--------|--------|----------|
| **societe.com** | ⚠️ Partiel | Accès WebFetch OK, browser redirige. URL: `/societe/{nom}-{siren}.html` |
| **118712.fr** | ❌ Échec | "Page introuvable" pour les DOM (pas de couverture) |
| **Qualibat** | ✅ Testé | 0 en 971, 4 en 974 (faible couverture DOM) |
| **Google Maps** | ✅ **SUCCÈS** | 283 plombiers (v2), 100% téléphones |
| **Qualit'EnR** | ⚠️ Partiel | Annuaire RGE, JS requis (QualiPAC, Qualisol, etc.) |
| **France Rénov** | ❌ Échec | Redirect vers france-renov.gouv.fr, JS requis |
| **ADEME Open Data** | ❌ Échec | Dataset RGE retourne 404 |
| **API recherche-entreprises** | ✅ **SUCCÈS** | 79 SIREN enrichis sur 218 manquants |
| **Leboncoin** | ❌ Échec | 0 résultats pour plombiers DOM |
| **Facebook Pages** | ⚠️ Non testé | Requiert authentification |
| **CMA (Chambre Métiers)** | ❌ Échec | Pas d'annuaire public accessible |
| **CAPEB/FFB** | ❌ Échec | 0 résultats pour DOM |

### Détails par Source

#### societe.com
- **Données disponibles** : SIREN, SIRET, raison sociale, adresse, code NAF, dirigeants, capital, date création, chiffre d'affaires
- **URL recherche** : `https://www.societe.com/cgi-bin/search?q=plombier+guadeloupe`
- **URL fiche** : `https://www.societe.com/societe/{nom-slug}-{siren}.html`
- **Problème** : Cloudflare + Didomi consent bloquent le scraping browser
- **Solution** : API payante disponible (`/solutions/api`)

#### Qualibat (Testé avec succès via Playwright)
- **Codes plomberie** :
  - `5111` - Installation plomberie sanitaire < 1000 m²
  - `5112` - Installation plomberie sanitaire > 1000 m² sans surpresseur
  - `5113` - Installation plomberie sanitaire avec surpresseur/industrie
- **Annuaire** : https://www.qualibat.com/annuaire-entreprises-qualifiees
- **Recherche** : Par SIRET, nom, localisation, qualification
- **Résultats DOM (code 5111, rayon 101km)** :
  - **971 Guadeloupe** : 0 résultat
  - **974 La Réunion** : 4 entreprises certifiées :
    1. OPTIMUM PLOMBERIE - 97400 Saint-Denis (1 qualification)
    2. EPSC SARL - 97430 Le Tampon (1 qualification)
    3. TEKOA - 97410 Saint-Pierre (4 qualifications, RGE)
    4. OMNIS FLUIDES - 97429 Petite-Île (2 qualifications)
- **Conclusion** : Faible couverture DOM, non prioritaire pour enrichissement

#### Qualit'EnR (RGE)
- **URL** : https://www.qualit-enr.org/annuaire/
- **Certifications** : QualiPAC, Qualisol, Qualibois, QualiPV
- **Données** : Nom, adresse, compétences, certificats téléchargeables
- **Problème** : Interface JavaScript, pas d'API publique

### Conclusion
Les sources SIRENE + Pages Jaunes restent les plus accessibles et complètes pour l'extraction automatisée.

**Qualibat** : Testé avec succès via Playwright. La couverture DOM est très faible (0 en 971, 4 en 974). Les 4 entreprises de La Réunion peuvent être ajoutées manuellement si nécessaire, mais le gain est marginal.

#### Google Maps (Scraping Stealth - SUCCÈS)
- **Script** : `scripts/scrape_google_maps.py`
- **Méthode** : Playwright + playwright-stealth (anti-détection)
- **Config v2** : max_scroll_attempts=30, max_results=200 (exhaustif)

**Résultats v1 (initial)** :
| Département | Plombiers | Téléphones |
|-------------|-----------|------------|
| 971 Guadeloupe | 65 | 65 (100%) |
| 972 Martinique | 56 | 56 (100%) |
| 973 Guyane | 30 | 30 (100%) |
| 974 La Réunion | 98 | 98 (100%) |
| **TOTAL v1** | **249** | **249 (100%)** |

**Résultats v2 (exhaustif)** :
| Département | Plombiers | Téléphones |
|-------------|-----------|------------|
| 971 Guadeloupe | 86 | 86 (100%) |
| 972 Martinique | 58 | 58 (100%) |
| 973 Guyane | 30 | 30 (100%) |
| 974 La Réunion | 109 | 109 (100%) |
| **TOTAL v2** | **283** | **283 (100%)** |

- **Fusion avec dataset existant (v2)** :
  - Matchés par téléphone : 236
  - Matchés par nom (fuzzy) : 25
  - Téléphones enrichis : +4
  - Sites web enrichis : +8
  - Nouvelles entrées : +22

#### Enrichissement SIREN via API (SUCCÈS)
- **Script** : `scripts/enrich_siren_api.py`
- **API** : `recherche-entreprises.api.gouv.fr/search`
- **Méthode** : Recherche par nom + département, matching fuzzy
- **Résultats** :
  - Entrées sans SIREN : 218
  - SIREN trouvés : 79 (36%)
  - Non trouvés : 139 (noms trop génériques ou entreprises fermées)

#### Classification EI vs Société
- **Source** : Code forme juridique (categorieJuridiqueUniteLegale)
- **Mapping** :
  - `1000-1900` → Entrepreneur Individuel (EI)
  - `5498` → EURL (individuel)
  - `5720` → SASU (individuel)
  - `5499` → SARL (société)
  - `5710` → SAS (société)
- **Résultats** : 1215 EI (59.9%), 734 sociétés (36.2%), 78 non classifiés (3.8%)
- **Méthodes additionnelles** : patterns dans le nom (SARL, EI, artisan), noms personnels, geo-branding (974...)
- **Note** : Les 78 non classifiés ont des noms génériques impossibles à classifier automatiquement

---

## Prochaines Actions

1. ~~Extraire SIRENE pour tous les départements~~ ✅ FAIT
2. ~~Développer script Pages Jaunes avec extraction exhaustive~~ ✅ FAIT
3. ~~Lancer l'extraction Pages Jaunes pour chaque département~~ ✅ FAIT
4. ~~Lancer le script d'agrégation~~ ✅ FAIT
5. ~~Croiser SIRENE + Pages Jaunes par SIREN~~ ✅ FAIT (184 entrées fusionnées)
6. ~~Explorer sources additionnelles~~ ✅ FAIT (societe.com, Qualibat, RGE, etc.)
7. **OPTIONNEL** : Valider échantillon 10% manuellement
8. **OPTIONNEL** : Enrichir les 148 sans code postal via recherche manuelle
9. ~~Scraper Qualibat avec Playwright~~ ✅ FAIT (faible couverture DOM : 0 en 971, 4 en 974)
10. ~~Scraper Google Maps avec Stealth~~ ✅ FAIT (283 plombiers, 100% téléphones) - v2 exhaustif
11. ~~Fusionner Google Maps avec dataset~~ ✅ FAIT (+22 nouvelles entrées)
12. ~~Enrichir SIREN via API recherche-entreprises~~ ✅ FAIT (79 SIREN trouvés sur 218 manquants)
13. ~~Classifier EI vs Société~~ ✅ FAIT (1153 EI, 695 sociétés)

---

## Notes Techniques

### Code APE Plomberie
- `43.22A` - Travaux d'installation d'eau et de gaz en tous locaux ✅ (pertinent pour shattaf)
- ~~`43.22B` - Travaux d'installation d'équipements thermiques et de climatisation~~ (exclu - chauffage/clim)

### Départements DOM
- `971` - Guadeloupe (codes postaux 97100-97190)
- `972` - Martinique (codes postaux 97200-97290)
- `973` - Guyane (codes postaux 97300-97390)
- `974` - La Réunion (codes postaux 97400-97490)

### Structure CSV Cible
Voir `scripts/aggregate.py` pour la liste complète des colonnes.

---

## Résumé Final (2026-01-26)

### Dataset Final : `processed/plombiers_final.csv`

| Métrique | Valeur |
|----------|--------|
| **Total plombiers** | 2,027 |
| **Avec téléphone** | 443 (21.9%) |
| **Avec SIREN** | 1,888 (93.1%) |
| **Avec email** | 47 (2.3%) |
| **Avec site_web** | 145 (7.2%) |
| **EI (individuels)** | 1,153 (56.9%) |
| **Sociétés (SARL/SAS)** | 695 (34.3%) |
| **Non classifié** | 179 (8.8%) |

### Par Département

| Dept | Total | Tél | SIREN | Email | EI | Société |
|------|-------|-----|-------|-------|-----|---------|
| 971 - Guadeloupe | 606 | 139 | 569 | 9 | 351 | 205 |
| 972 - Martinique | 438 | 92 | 411 | 6 | 229 | 173 |
| 973 - Guyane | 247 | 51 | 239 | 5 | 121 | 115 |
| 974 - La Réunion | 588 | 161 | 537 | 27 | 343 | 179 |
| Sans département | 148 | 0 | 132 | 0 | 109 | 23 |

### Détail avec téléphone
| Type | Avec tél |
|------|----------|
| EI (individuels) | 174 |
| Sociétés | 200 |
| Non classifié | 69 |

### Méthodes de classification utilisées
1. SIREN → forme juridique officielle
2. Forme juridique dans le nom (SARL, EURL, EI...)
3. Noms personnels (prénom + nom → EI)
4. Pattern "Artisan" → EI
5. Franchise "Plomberie Dom" → société
6. Geo-branding (974, 971...) → EI
7. Initiales/acronymes courts → EI

### Scripts Développés

| Script | Description |
|--------|-------------|
| `scrape_pj_playwright.py` | Scraping Pages Jaunes avec Playwright (30kb) |
| `scrape_pagesjaunes.py` | Version alternative scraping PJ |
| `scrape_google_maps.py` | Scraping Google Maps avec stealth mode |
| `merge_google_maps.py` | Fusion Google Maps + dataset existant |
| `enrich_siren_api.py` | Enrichissement SIREN via API gouv.fr |
| `enrich_siren.py` | Version Playwright (plus lent) |
| `enrich_pappers.py` | Enrichissement via Pappers API (payant) |
| `aggregate.py` | Agrégation et déduplication multi-sources |
| `match_sources.py` | Matching fuzzy entre sources |
| `utils.py` | Fonctions utilitaires (normalisation tel/email) |
| `scrape_websites.py` | Scraping sites web pour emails |

### Méthodes Testées

| Méthode | Résultat | Téléphones |
|---------|----------|------------|
| SIRENE (annuaire-entreprises) | ✅ 1,783 entrées | 0 |
| Pages Jaunes scraping | ✅ 366 entrées | ~300 |
| Google Maps stealth | ✅ 283 entrées | 283 |
| API recherche-entreprises | ✅ 79 SIREN enrichis | - |
| Qualibat | ⚠️ 4 entrées (974 only) | - |
| societe.com | ❌ Cloudflare bloqué | - |
| 118712.fr | ❌ Pas de couverture DOM | - |
| Leboncoin | ❌ 0 résultats | - |
| CAPEB/FFB | ❌ 0 résultats DOM | - |

#### Scraping Sites Web (SUCCÈS PARTIEL)
- **Script** : `scripts/scrape_websites.py`
- **Méthode** : Requests + regex pour emails/téléphones
- **Sites scrapés** : 145
- **Emails trouvés** : 47 bruts → 36 valides (après nettoyage)
- **Erreurs** : 45 (Facebook, Instagram, sites morts, 403/404)
- **Note** : Tous les sites avaient déjà des téléphones, donc 0 nouveaux tél

### Méthodes Additionnelles Testées (2026-01-26)

| Méthode | Script | Résultat | Téléphones |
|---------|--------|----------|------------|
| societe.com scraping | `scrape_societe.py` | ❌ Pas de tél sur les pages | 0 |
| Google Search | `google_phone_search.py` | ❌ Pas de tél dans résultats | 0 |
| 118712.fr | - | ❌ 403 Forbidden | 0 |
| Pappers API | - | ❌ Requiert API token payant | 0 |

**Conclusion** : Les 1,584 entrées avec SIREN mais sans téléphone n'ont pas de numéro disponible publiquement. Les téléphones des petits plombiers DOM ne sont généralement pas répertoriés dans les annuaires publics.

### Pistes Non Exploitées
- Facebook Pages (requiert auth)
- Appels directs aux entreprises (hors scope)
- Publicité ciblée pour inciter les plombiers à s'inscrire
