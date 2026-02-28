#!/usr/bin/env python3
"""
Recherche SIREN sur Pages Jaunes pour les entrées sans SIREN.
"""

import csv
import re
import time
import random
import requests
from pathlib import Path
from difflib import SequenceMatcher
from urllib.parse import quote

DEPT_NAMES = {
    '971': 'guadeloupe',
    '972': 'martinique',
    '973': 'guyane',
    '974': 'reunion',
}

def normalize(name):
    if not name:
        return ''
    name = name.lower()
    name = re.sub(r'[^a-z0-9\s]', '', name)
    return ' '.join(name.split())

def similarity(a, b):
    return SequenceMatcher(None, normalize(a), normalize(b)).ratio()

def search_pagesjaunes(name, dept):
    """Recherche sur Pages Jaunes et extrait le SIREN."""
    try:
        dept_name = DEPT_NAMES.get(dept, '')
        if not dept_name:
            return None

        # Build search URL
        query = quote(f"{name} plombier")
        url = f"https://www.pagesjaunes.fr/pagesblanches/recherche?quoiqui={query}&ou={dept_name}"

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'fr-FR,fr;q=0.9',
        }

        resp = requests.get(url, headers=headers, timeout=15)
        if resp.status_code != 200:
            return None

        content = resp.text

        # Look for SIREN pattern (9 digits)
        siren_matches = re.findall(r'siren["\s:=]+(\d{9})', content, re.IGNORECASE)
        siret_matches = re.findall(r'siret["\s:=]+(\d{14})', content, re.IGNORECASE)

        if siret_matches:
            return {'siren': siret_matches[0][:9], 'siret': siret_matches[0]}
        if siren_matches:
            return {'siren': siren_matches[0], 'siret': ''}

        return None

    except Exception as e:
        return None

def search_api_by_phone(phone, dept):
    """Recherche via API avec le téléphone."""
    try:
        # Clean phone
        phone_clean = re.sub(r'[\s\.\-]', '', phone)

        url = f"https://recherche-entreprises.api.gouv.fr/search?q={phone_clean}&departement={dept}"
        resp = requests.get(url, timeout=10)

        if resp.status_code == 200:
            results = resp.json().get('results', [])
            if results:
                r = results[0]
                nature = str(r.get('nature_juridique', ''))
                return {
                    'siren': r.get('siren', ''),
                    'siret': r.get('siege', {}).get('siret', ''),
                    'forme_juridique': nature,
                }
        return None
    except:
        return None

def search_api_by_name_strict(name, dept):
    """Recherche stricte par nom sur l'API."""
    try:
        url = f"https://recherche-entreprises.api.gouv.fr/search?q={quote(name)}&departement={dept}&per_page=10"
        resp = requests.get(url, timeout=10)

        if resp.status_code == 200:
            results = resp.json().get('results', [])
            for r in results:
                result_name = r.get('nom_complet', '') or r.get('nom_raison_sociale', '')
                if similarity(name, result_name) > 0.8:  # Strict match
                    nature = str(r.get('nature_juridique', ''))
                    return {
                        'siren': r.get('siren', ''),
                        'siret': r.get('siege', {}).get('siret', ''),
                        'forme_juridique': nature,
                    }
        return None
    except:
        return None

def is_individual(code):
    code = str(code)
    if code.startswith('1'):
        return 'OUI'
    if code in ['5498', '5720']:
        return 'OUI'
    if code.startswith('5') or code.startswith('6'):
        return 'NON'
    return ''

def main():
    base_dir = Path(__file__).parent.parent
    input_file = base_dir / 'processed/plombiers_final.csv'
    output_file = base_dir / 'processed/plombiers_final.csv'

    with open(input_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        data = list(reader)
        fieldnames = reader.fieldnames

    # Find entries without SIREN
    to_search = [(i, r) for i, r in enumerate(data) if not r.get('siren') and r.get('raison_sociale')]

    print(f"Entrées sans SIREN: {len(to_search)}")
    print()

    found = 0

    for idx, (i, row) in enumerate(to_search):
        name = row.get('raison_sociale', '')
        dept = row.get('departement', '')
        phone = row.get('telephone', '')

        print(f"[{idx+1}/{len(to_search)}] {name[:40]}... (dept {dept})")

        result = None

        # Method 1: Strict API search by name
        result = search_api_by_name_strict(name, dept)
        if result:
            print(f"    -> API nom: {result['siren']}")

        # Method 2: Search by phone if available
        if not result and phone:
            result = search_api_by_phone(phone, dept)
            if result:
                print(f"    -> API tél: {result['siren']}")

        if result and result.get('siren'):
            data[i]['siren'] = result['siren']
            if result.get('siret'):
                data[i]['siret'] = result['siret']
            if result.get('forme_juridique'):
                data[i]['forme_juridique'] = result['forme_juridique']
                data[i]['individuel'] = is_individual(result['forme_juridique'])
            found += 1
        else:
            print(f"    -> Non trouvé")

        time.sleep(0.3)

        # Save periodically
        if (idx + 1) % 30 == 0:
            with open(output_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(data)
            print(f"\n  [Sauvegarde: {found} trouvés]\n")

    # Final save
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)

    print(f"\n=== RÉSULTATS ===")
    print(f"Cherchés: {len(to_search)}")
    print(f"Trouvés: {found}")
    print(f"Fichier: {output_file}")

if __name__ == '__main__':
    main()
