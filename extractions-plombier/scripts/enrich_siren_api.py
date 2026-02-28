#!/usr/bin/env python3
"""
Enrichit les entrées sans SIREN en utilisant l'API annuaire-entreprises.
Plus rapide et fiable que le scraping.
"""

import csv
import json
import re
import time
import random
import requests
from pathlib import Path
from difflib import SequenceMatcher

# Mapping des codes de forme juridique
FORME_JURIDIQUE = {
    '1000': ('EI', 'OUI'),
    '1100': ('EI', 'OUI'),
    '1200': ('EI', 'OUI'),
    '1300': ('EI', 'OUI'),
    '1400': ('EI', 'OUI'),
    '1500': ('EI', 'OUI'),
    '1600': ('EI', 'OUI'),
    '1700': ('EI', 'OUI'),
    '1800': ('EI', 'OUI'),
    '1900': ('EI', 'OUI'),
    '5499': ('SARL', 'NON'),
    '5485': ('SARL', 'NON'),
    '5498': ('EURL', 'OUI'),
    '5710': ('SAS', 'NON'),
    '5720': ('SASU', 'OUI'),
    '5599': ('SA', 'NON'),
    '6220': ('GIE', 'NON'),
}


def normalize_name(name: str) -> str:
    """Normalise un nom pour comparaison."""
    if not name:
        return ''
    name = name.lower()
    name = re.sub(r'[^a-z0-9\s]', '', name)
    name = ' '.join(name.split())
    for word in ['sarl', 'sas', 'sasu', 'eurl', 'eirl', 'ei', 'ets', 'etablissements', 'plomberie', 'plombier']:
        name = re.sub(rf'\b{word}\b', '', name)
    return name.strip()


def similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()


def get_dept_code(dept: str, name: str = '', address: str = '') -> str:
    """Retourne le code département."""
    if dept in ['971', '972', '973', '974']:
        return dept
    if dept and len(dept) >= 3:
        return dept[:3]

    text = f"{name} {address}".lower()
    if 'guadeloupe' in text or '971' in text:
        return '971'
    if 'martinique' in text or '972' in text:
        return '972'
    if 'guyane' in text or '973' in text:
        return '973'
    if 'réunion' in text or 'reunion' in text or '974' in text:
        return '974'
    return ''


def search_entreprise(name: str, dept: str) -> dict | None:
    """Recherche via l'API annuaire-entreprises."""
    try:
        # API de recherche
        url = "https://recherche-entreprises.api.gouv.fr/search"
        params = {
            'q': name,
            'departement': dept,
            'activite_principale': '43.22A',  # Plomberie
            'page': 1,
            'per_page': 5,
        }

        response = requests.get(url, params=params, timeout=30)
        if response.status_code != 200:
            return None

        data = response.json()
        results = data.get('results', [])

        if not results:
            # Essayer sans filtre APE
            params.pop('activite_principale')
            response = requests.get(url, params=params, timeout=30)
            if response.status_code == 200:
                data = response.json()
                results = data.get('results', [])

        if not results:
            return None

        # Trouver le meilleur match
        name_norm = normalize_name(name)
        for result in results:
            result_name = result.get('nom_complet', '') or result.get('nom_raison_sociale', '')
            if similarity(name_norm, normalize_name(result_name)) > 0.5:
                siren = result.get('siren', '')
                nature_juridique = str(result.get('nature_juridique', ''))

                individuel = 'NON'
                if nature_juridique in FORME_JURIDIQUE:
                    individuel = FORME_JURIDIQUE[nature_juridique][1]
                elif nature_juridique.startswith('1'):
                    individuel = 'OUI'

                return {
                    'siren': siren,
                    'siret': result.get('siege', {}).get('siret', ''),
                    'forme_juridique': nature_juridique,
                    'individuel': individuel,
                }

        return None

    except Exception as e:
        print(f"    Erreur API: {str(e)[:50]}")
        return None


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Enrichir les entrées sans SIREN via API')
    parser.add_argument('--input', '-i', default='processed/plombiers_final_enriched.csv')
    parser.add_argument('--output', '-o', default='processed/plombiers_enriched_siren.csv')
    args = parser.parse_args()

    base_dir = Path(__file__).parent.parent
    input_file = base_dir / args.input
    output_file = base_dir / args.output

    # Charger les données
    with open(input_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        data = list(reader)
        fieldnames = reader.fieldnames

    # Filtrer les entrées sans SIREN
    to_enrich = [
        (i, row) for i, row in enumerate(data)
        if not row.get('siren') and row.get('raison_sociale')
    ]

    print(f"Total: {len(data)} entrées")
    print(f"Sans SIREN: {len(to_enrich)} entrées à enrichir")
    print()

    if not to_enrich:
        print("Rien à enrichir!")
        return

    stats = {'found': 0, 'not_found': 0}

    for idx, (i, row) in enumerate(to_enrich):
        name = row.get('raison_sociale', '')
        address = row.get('adresse', '')
        dept = get_dept_code(
            row.get('departement', '') or row.get('code_postal', ''),
            name,
            address
        )

        print(f"[{idx+1}/{len(to_enrich)}] {name[:50]}... (dept {dept or '?'})")

        result = None
        if dept:
            result = search_entreprise(name, dept)
        else:
            # Essayer tous les DOM
            for try_dept in ['974', '971', '972', '973']:
                result = search_entreprise(name, try_dept)
                if result:
                    break
                time.sleep(0.3)

        if result and result.get('siren'):
            data[i]['siren'] = result['siren']
            if result.get('siret'):
                data[i]['siret'] = result['siret']
            if result.get('forme_juridique'):
                data[i]['forme_juridique'] = result['forme_juridique']
            if result.get('individuel'):
                data[i]['individuel'] = result['individuel']

            stats['found'] += 1
            print(f"    -> TROUVÉ: {result['siren']} ({result.get('individuel', '?')})")
        else:
            stats['not_found'] += 1
            print(f"    -> Non trouvé")

        # Petite pause
        time.sleep(random.uniform(0.2, 0.5))

        # Sauvegarder régulièrement
        if (idx + 1) % 50 == 0:
            with open(output_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(data)
            print(f"\n  [Sauvegarde: {stats}]\n")

    # Sauvegarder final
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)

    print("\n=== RÉSULTATS ===")
    print(f"Trouvés: {stats['found']}")
    print(f"Non trouvés: {stats['not_found']}")
    print(f"Fichier: {output_file}")


if __name__ == '__main__':
    main()
