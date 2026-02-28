# Sources et Méthodologie - Liste des Plombiers Indépendants DOM (971-974)

## Objectif

Établir une liste exhaustive des plombiers indépendants dans les départements d'outre-mer :
- **971** - Guadeloupe
- **972** - Martinique
- **973** - Guyane
- **974** - La Réunion

**Format de sortie** : Fichier CSV

---

## 1. Sources de Données

### 1.1 Base SIRENE (INSEE)

**URL** : https://www.sirene.fr / https://api.insee.fr/catalogue/

**Description** : Base officielle de l'INSEE contenant toutes les entreprises françaises.

**Codes APE ciblés** :
- `4322A` - Travaux d'installation d'eau et de gaz en tous locaux
- `4322B` - Travaux d'installation d'équipements thermiques et de climatisation

**Filtres à appliquer** :
- Département : 971, 972, 973, 974
- Catégorie juridique : Entreprises individuelles, EURL, SASU (artisans indépendants)
- État : Entreprises actives uniquement

**Données récupérables** :
- SIREN / SIRET
- Raison sociale
- Adresse complète
- Date de création
- Code APE
- Catégorie juridique

### 1.2 Annuaire des Entreprises (data.gouv.fr)

**URL** : https://annuaire-entreprises.data.gouv.fr/

**Description** : Portail d'accès aux données publiques des entreprises, plus convivial que SIRENE brut.

**Avantages** :
- Interface de recherche intuitive
- Export possible
- Données enrichies (dirigeants, établissements)

**Utilisation** :
1. Recherche par activité "plomberie" ou code APE
2. Filtrage par département DOM
3. Export des résultats

### 1.3 Portail de la Publicité Légale (BODACC)

**URL** : https://www.bodacc.fr/

**Description** : Bulletin Officiel des Annonces Civiles et Commerciales.

**Utilité** :
- Identifier les créations d'entreprises récentes
- Vérifier les radiations (entreprises cessées)
- Détecter les modifications statutaires

**Filtres** :
- Type d'annonce : Immatriculation (création)
- Département : 971-974
- Activité : Plomberie / Installation sanitaire

### 1.4 Registre National des Entreprises (RNE)

**URL** : https://www.infogreffe.fr/ (via Infogreffe)

**Description** : Nouveau registre unifié remplaçant le RCS et le RM.

**Données complémentaires** :
- Qualification artisanale
- Inscription au répertoire des métiers

### 1.5 Annuaires Privés (Enrichissement)

| Source | URL | Données |
|--------|-----|---------|
| Pages Jaunes | pagesjaunes.fr | Téléphone, horaires, avis |
| 118 712 | 118712.fr | Coordonnées téléphoniques |
| Kompass | kompass.com | Profil entreprise détaillé |
| Société.com | societe.com | Informations financières |
| Qualibat | qualibat.com | Certifications |

---

## 2. Méthodologie d'Extraction

### 2.1 Étape 1 : Extraction de la Base SIRENE

```
1. Accéder à l'API SIRENE ou télécharger le fichier stock
2. Filtrer par :
   - codePostal commençant par 971, 972, 973, 974
   - activitePrincipaleEtablissement = 4322A OU 4322B
   - etatAdministratifEtablissement = A (actif)
3. Exporter : SIREN, SIRET, denomination, adresse, dateCreation
```

### 2.2 Étape 2 : Enrichissement via Annuaire Entreprises

```
1. Pour chaque SIREN extrait :
   - Requête sur annuaire-entreprises.data.gouv.fr
   - Récupérer : dirigeant, effectif, forme juridique détaillée
2. Compléter le fichier avec ces informations
```

### 2.3 Étape 3 : Vérification Publicité Légale

```
1. Croiser avec BODACC pour :
   - Confirmer l'activité des entreprises
   - Identifier les radiations récentes
   - Repérer les créations < 2 ans (plombiers nouvellement diplômés)
2. Marquer les entreprises radiées comme "INACTIVE"
```

### 2.4 Étape 4 : Récupération des Coordonnées

```
1. Pour chaque entreprise active :
   - Recherche Pages Jaunes par nom + ville
   - Extraction : téléphone, email, site web
2. Sources alternatives si non trouvé :
   - Recherche Google "nom entreprise + ville + plombier"
   - Profils réseaux sociaux professionnels
```

### 2.5 Étape 5 : Filtrage Artisans Récents

Pour cibler les plombiers nouvellement diplômés :
```
1. Filtrer dateCreation >= (date actuelle - 2 ans)
2. Prioriser les entreprises individuelles
3. Ces profils sont plus susceptibles de chercher des clients
```

---

## 3. Structure du Fichier CSV Final

### 3.1 Colonnes du CSV

| Colonne | Description | Obligatoire |
|---------|-------------|-------------|
| `siren` | Numéro SIREN (9 chiffres) | Oui |
| `siret` | Numéro SIRET (14 chiffres) | Oui |
| `raison_sociale` | Nom de l'entreprise | Oui |
| `nom_dirigeant` | Nom du dirigeant | Non |
| `prenom_dirigeant` | Prénom du dirigeant | Non |
| `code_ape` | Code APE (4322A/4322B) | Oui |
| `forme_juridique` | EI, EURL, SASU, etc. | Oui |
| `adresse` | Adresse complète | Oui |
| `code_postal` | Code postal | Oui |
| `ville` | Ville | Oui |
| `departement` | 971, 972, 973 ou 974 | Oui |
| `telephone` | Numéro de téléphone | Non |
| `email` | Adresse email | Non |
| `site_web` | URL du site web | Non |
| `date_creation` | Date de création entreprise | Oui |
| `anciennete` | Nombre d'années d'activité | Non |
| `certifications` | Qualibat, RGE, etc. | Non |
| `statut` | ACTIF / INACTIF | Oui |
| `source` | Source des données | Oui |
| `date_extraction` | Date de l'extraction | Oui |

### 3.2 Exemple de Ligne CSV

```csv
siren,siret,raison_sociale,nom_dirigeant,prenom_dirigeant,code_ape,forme_juridique,adresse,code_postal,ville,departement,telephone,email,site_web,date_creation,anciennete,certifications,statut,source,date_extraction
123456789,12345678900012,PLOMBERIE CARAIBE,MARTIN,Jean,4322A,EI,15 rue des Palmiers,97100,Basse-Terre,971,0590123456,contact@plomberie-caraibe.gp,https://plomberie-caraibe.gp,2022-03-15,2,RGE,ACTIF,SIRENE+PagesJaunes,2025-01-25
```

---

## 4. Outils Recommandés

### 4.1 Pour l'Extraction

- **Python** avec bibliothèques :
  - `requests` - Appels API
  - `pandas` - Manipulation données
  - `beautifulsoup4` - Scraping pages web

### 4.2 Pour le Traitement

```python
import pandas as pd

# Exemple de structure
colonnes = [
    'siren', 'siret', 'raison_sociale', 'nom_dirigeant', 'prenom_dirigeant',
    'code_ape', 'forme_juridique', 'adresse', 'code_postal', 'ville',
    'departement', 'telephone', 'email', 'site_web', 'date_creation',
    'anciennete', 'certifications', 'statut', 'source', 'date_extraction'
]

df = pd.DataFrame(columns=colonnes)
df.to_csv('plombiers_dom.csv', index=False, encoding='utf-8-sig')
```

### 4.3 APIs Utiles

| API | Endpoint | Usage |
|-----|----------|-------|
| SIRENE | `api.insee.fr/entreprises/sirene/V3` | Données entreprises |
| Annuaire Entreprises | `recherche-entreprises.api.gouv.fr` | Recherche simplifiée |
| Base Adresse | `api-adresse.data.gouv.fr` | Géocodage adresses |

---

## 5. Considérations Légales

### 5.1 RGPD

- Les données SIRENE sont publiques et réutilisables
- Les coordonnées téléphoniques/email nécessitent le consentement pour prospection commerciale
- Respecter la liste d'opposition Bloctel pour les appels téléphoniques

### 5.2 Bonnes Pratiques

- Indiquer la source des données
- Permettre le désabonnement/suppression sur demande
- Ne pas revendre les données à des tiers
- Mettre à jour régulièrement (entreprises radiées)

---

## 6. Estimation du Volume

| Département | Estimation entreprises plomberie |
|-------------|----------------------------------|
| 971 - Guadeloupe | 200 - 400 |
| 972 - Martinique | 200 - 350 |
| 973 - Guyane | 100 - 200 |
| 974 - La Réunion | 300 - 500 |
| **Total estimé** | **800 - 1450** |

---

## 7. Prochaines Étapes

1. [ ] Créer un compte API SIRENE (gratuit)
2. [ ] Développer le script d'extraction Python
3. [ ] Automatiser l'enrichissement des coordonnées
4. [ ] Valider manuellement un échantillon (10%)
5. [ ] Exporter le CSV final
6. [ ] Planifier les mises à jour trimestrielles
