#!/usr/bin/env python3
"""
Agrégation et déduplication des sources plombiers DOM.

Usage:
    python aggregate.py
    python aggregate.py --departement 971
    python aggregate.py --output mon_fichier.csv
"""

import argparse
import csv
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

from utils import (
    normalize_siren,
    normalize_siret,
    normalize_phone,
    normalize_email,
    extract_departement,
    calculate_similarity,
)

# Mapping des colonnes par source vers colonnes finales
COLUMN_MAPPINGS = {
    'sirene': {
        'siren': 'siren',
        'siret': 'siret',
        'denominationUniteLegale': 'raison_sociale',
        'nomUniteLegale': 'nom_dirigeant',
        'prenom1UniteLegale': 'prenom_dirigeant',
        'activitePrincipaleEtablissement': 'code_ape',
        'categorieJuridiqueUniteLegale': 'forme_juridique',
        'codePostalEtablissement': 'code_postal',
        'libelleCommuneEtablissement': 'ville',
        'dateCreationEtablissement': 'date_creation',
        'etatAdministratifEtablissement': 'statut',
        # Adresse composée
        '_address_parts': ['numeroVoieEtablissement', 'typeVoieEtablissement', 'libelleVoieEtablissement'],
    },
    'pagesjaunes': {
        'nom': 'raison_sociale',
        'adresse': 'adresse',
        'code_postal': 'code_postal',
        'ville': 'ville',
        'departement': 'departement',
        'telephone_1': 'telephone',
        'telephone_2': 'telephone_2',
        'site_web': 'site_web',
        'siren': 'siren',
        'siret': 'siret',
        'code_naf': 'code_ape',
        'date_creation': 'date_creation',
        'note_pj': 'note_avis',
        'nb_avis_pj': 'nb_avis',
    },
}

# Colonnes du CSV final
COLUMNS = [
    'siren',
    'siret',
    'raison_sociale',
    'nom_dirigeant',
    'prenom_dirigeant',
    'code_ape',
    'forme_juridique',
    'adresse',
    'code_postal',
    'ville',
    'departement',
    'telephone',
    'telephone_2',
    'email',
    'site_web',
    'date_creation',
    'certifications',
    'note_avis',
    'nb_avis',
    'statut',
    'individuel',
    'provenance',
    'sources',
    'date_extraction',
]

# Priorité des sources (plus bas = plus fiable)
SOURCE_PRIORITY = {
    'sirene': 1,
    'annuaire_entreprises': 2,
    'infogreffe': 3,
    'pagesjaunes': 4,
    'societe': 5,
    'other': 10,
}


class PlombierRecord:
    """Représente un enregistrement plombier avec fusion de sources."""

    def __init__(self):
        self.data: Dict[str, Optional[str]] = {col: None for col in COLUMNS}
        self.sources: List[str] = []

    def merge(self, row: Dict[str, str], source: str):
        """Fusionne les données d'une nouvelle source."""
        self.sources.append(source)

        for col in COLUMNS:
            if col in ['sources', 'date_extraction', 'provenance', 'individuel']:
                continue

            new_value = row.get(col, '').strip() if row.get(col) else None
            current_value = self.data.get(col)

            # Si pas de valeur actuelle, prendre la nouvelle
            if not current_value and new_value:
                self.data[col] = new_value
            # Si les deux existent, garder selon priorité source
            elif current_value and new_value and current_value != new_value:
                # Pour certains champs, préférer la source prioritaire
                if col in ['siren', 'siret', 'raison_sociale', 'code_ape']:
                    current_priority = min(
                        SOURCE_PRIORITY.get(s, 10) for s in self.sources[:-1]
                    ) if len(self.sources) > 1 else 10
                    new_priority = SOURCE_PRIORITY.get(source, 10)

                    if new_priority < current_priority:
                        self.data[col] = new_value

    def to_dict(self) -> Dict[str, str]:
        """Exporte en dictionnaire pour CSV."""
        result = dict(self.data)

        # Sources
        unique_sources = sorted(set(self.sources))
        result['sources'] = '|'.join(unique_sources)

        # Provenance (lisible)
        if len(unique_sources) > 1:
            result['provenance'] = 'MULTIPLE'
        elif 'sirene' in unique_sources:
            result['provenance'] = 'SIRENE'
        elif 'pagesjaunes' in unique_sources:
            result['provenance'] = 'PAGESJAUNES'
        else:
            result['provenance'] = unique_sources[0].upper() if unique_sources else 'INCONNU'

        # Individuel (basé sur forme juridique)
        # Code 1000 = Entrepreneur individuel en France
        forme = result.get('forme_juridique', '')
        if forme == '1000':
            result['individuel'] = 'OUI'
        elif forme and forme != '':
            result['individuel'] = 'NON'
        else:
            result['individuel'] = ''

        result['date_extraction'] = datetime.now().strftime('%Y-%m-%d')
        return result


def map_row(row: Dict[str, str], source: str) -> Dict[str, str]:
    """Mappe les colonnes d'une source vers les colonnes finales."""
    mapping = COLUMN_MAPPINGS.get(source, {})
    result = {}

    # Appliquer le mapping
    for src_col, dst_col in mapping.items():
        if src_col.startswith('_'):
            continue  # Ignorer les champs spéciaux
        value = row.get(src_col, '')
        if value and value not in ['[ND]', 'ND', '']:
            result[dst_col] = value

    # Cas spécial: construire l'adresse pour SIRENE
    if source == 'sirene':
        addr_parts = mapping.get('_address_parts', [])
        addr_values = []
        for part in addr_parts:
            val = row.get(part, '')
            if val and val not in ['[ND]', 'ND', '']:
                addr_values.append(val)
        if addr_values:
            result['adresse'] = ' '.join(addr_values)

        # Convertir le statut SIRENE (A = Actif)
        if result.get('statut') == 'A':
            result['statut'] = 'ACTIF'
        elif result.get('statut') == 'F':
            result['statut'] = 'FERMÉ'

    # Copier les colonnes non mappées qui correspondent aux colonnes finales
    for col in COLUMNS:
        if col not in result and row.get(col):
            val = row.get(col, '')
            if val and val not in ['[ND]', 'ND', '']:
                result[col] = val

    return result


def load_raw_files(raw_dir: Path, departement: Optional[str] = None) -> List[tuple]:
    """Charge tous les fichiers CSV du dossier raw."""
    records = []

    for csv_file in raw_dir.glob('*.csv'):
        # Ignorer les fichiers _original
        if '_original' in csv_file.stem:
            continue

        source = csv_file.stem.split('_')[0]  # sirene_971.csv -> sirene
        file_count = 0

        try:
            with open(csv_file, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    # Mapper les colonnes vers le format standard
                    mapped_row = map_row(row, source)

                    # Extraire le département du code postal si non présent
                    if not mapped_row.get('departement'):
                        mapped_row['departement'] = extract_departement(
                            mapped_row.get('code_postal', '')
                        )

                    # Filtrer par département si spécifié
                    if departement:
                        row_dept = mapped_row.get('departement', '')
                        if row_dept != departement:
                            continue

                    records.append((mapped_row, source))
                    file_count += 1

            print(f"  {csv_file.name}: {file_count} enregistrements (source: {source})")
        except Exception as e:
            print(f"Erreur lecture {csv_file}: {e}")

    return records


def deduplicate(records: List[tuple]) -> List[PlombierRecord]:
    """Déduplique les enregistrements par SIREN."""
    by_siren: Dict[str, PlombierRecord] = {}
    no_siren: List[PlombierRecord] = []

    for row, source in records:
        siren = normalize_siren(row.get('siren', '') or row.get('siret', ''))

        if siren:
            if siren not in by_siren:
                by_siren[siren] = PlombierRecord()
            by_siren[siren].merge(row, source)
        else:
            # Sans SIREN, créer un enregistrement séparé
            # TODO: matcher par nom + adresse
            record = PlombierRecord()
            record.merge(row, source)
            no_siren.append(record)

    # Fusionner les sans-SIREN avec les existants par similarité nom
    for orphan in no_siren:
        orphan_name = orphan.data.get('raison_sociale', '')
        matched = False

        for siren, record in by_siren.items():
            similarity = calculate_similarity(
                orphan_name,
                record.data.get('raison_sociale', '')
            )
            if similarity > 0.8:
                # Fusionner
                for col, val in orphan.data.items():
                    if val and not record.data.get(col):
                        record.data[col] = val
                record.sources.extend(orphan.sources)
                matched = True
                break

        if not matched:
            # Garder comme enregistrement séparé
            # Générer une clé unique
            key = f"NOSIREN_{len(by_siren)}"
            by_siren[key] = orphan

    return list(by_siren.values())


def normalize_records(records: List[PlombierRecord]) -> List[PlombierRecord]:
    """Normalise tous les enregistrements."""
    for record in records:
        # Normaliser les champs
        record.data['siren'] = normalize_siren(record.data.get('siren', ''))
        record.data['siret'] = normalize_siret(record.data.get('siret', ''))
        record.data['telephone'] = normalize_phone(record.data.get('telephone', ''))
        record.data['telephone_2'] = normalize_phone(record.data.get('telephone_2', ''))
        record.data['email'] = normalize_email(record.data.get('email', ''))

        # Extraire département du code postal
        if not record.data.get('departement'):
            record.data['departement'] = extract_departement(
                record.data.get('code_postal', '')
            )

        # Statut par défaut
        if not record.data.get('statut'):
            record.data['statut'] = 'ACTIF'

    return records


def write_csv(records: List[PlombierRecord], output_path: Path):
    """Écrit le CSV final."""
    with open(output_path, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=COLUMNS)
        writer.writeheader()

        for record in records:
            writer.writerow(record.to_dict())

    print(f"Écrit {len(records)} enregistrements dans {output_path}")


def main():
    parser = argparse.ArgumentParser(description='Agrège les sources plombiers DOM')
    parser.add_argument('--departement', '-d', help='Filtrer par département (971-974)')
    parser.add_argument('--output', '-o', default='plombiers_final.csv', help='Fichier de sortie')
    args = parser.parse_args()

    # Chemins
    base_dir = Path(__file__).parent.parent
    raw_dir = base_dir / 'raw'
    processed_dir = base_dir / 'processed'

    # Charger les fichiers bruts
    print(f"Chargement depuis {raw_dir}...")
    records = load_raw_files(raw_dir, args.departement)
    print(f"  {len(records)} enregistrements bruts")

    if not records:
        print("Aucun enregistrement trouvé. Ajoutez des CSV dans raw/")
        return

    # Dédupliquer
    print("Déduplication...")
    deduplicated = deduplicate(records)
    print(f"  {len(deduplicated)} enregistrements uniques")

    # Normaliser
    print("Normalisation...")
    normalized = normalize_records(deduplicated)

    # Écrire le résultat
    output_path = processed_dir / args.output
    write_csv(normalized, output_path)

    # Stats
    by_dept = {}
    for record in normalized:
        dept = record.data.get('departement') or 'Inconnu'
        by_dept[dept] = by_dept.get(dept, 0) + 1

    print("\nRépartition par département:")
    for dept, count in sorted(by_dept.items()):
        print(f"  {dept}: {count}")


if __name__ == '__main__':
    main()
