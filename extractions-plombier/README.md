# Extraction Plombiers DOM (971-974)

## Structure

```
extractions-plombier/
├── raw/                    # Données brutes par source
│   ├── sirene_971.csv
│   ├── sirene_972.csv
│   ├── pagesjaunes_971.csv
│   └── ...
├── processed/              # Données nettoyées
│   └── plombiers_final.csv # CSV final agrégé et dédupliqué
├── scripts/
│   ├── aggregate.py        # Agrégation et déduplication
│   └── utils.py            # Fonctions utilitaires
└── README.md
```

## Workflow

1. **Collecte** : Playwright MCP pour scraper les sources web
2. **Export** : Sauvegarder chaque source dans `raw/`
3. **Agrégation** : `python scripts/aggregate.py` pour fusionner
4. **Résultat** : `processed/plombiers_final.csv`

## Sources

| Source | Priorité | Données |
|--------|----------|---------|
| Annuaire Entreprises | 1 | SIREN, adresse, APE |
| Pages Jaunes | 2 | Téléphone, horaires |
| Societe.com | 3 | Dirigeant, finances |

## Commandes

```bash
# Agréger toutes les sources
python scripts/aggregate.py

# Avec options
python scripts/aggregate.py --departement 971 --output custom.csv
```
