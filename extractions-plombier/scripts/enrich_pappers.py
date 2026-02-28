#!/usr/bin/env python3
"""
Script d'enrichissement des données plombiers via l'API Pappers.
Teste sur les premiers SIRENs sans numéro de téléphone (25 par département).
"""

import os
import csv
import json
import requests
from pathlib import Path
from collections import defaultdict
from dotenv import load_dotenv

# Charger la clé API depuis .env
load_dotenv(Path(__file__).parent.parent / '.env')
API_KEY = os.getenv('PAPPERS_API_KEY')

BASE_URL = "https://api.pappers.fr/v2/entreprise"

def get_sirens_without_phone(csv_path: str, limit_per_dept: int = 25) -> dict[str, list[str]]:
    """Récupère les SIRENs sans téléphone, groupés par département."""
    sirens_by_dept = defaultdict(list)

    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            dept = row.get('departement', '').strip()
            siren = row.get('siren', '').strip()
            telephone = row.get('telephone', '').strip()
            telephone_2 = row.get('telephone_2', '').strip()

            # Seulement si pas de téléphone et SIREN valide
            if siren and not telephone and not telephone_2:
                if dept in ['971', '972', '973', '974']:
                    if len(sirens_by_dept[dept]) < limit_per_dept:
                        sirens_by_dept[dept].append(siren)

    return dict(sirens_by_dept)


def query_pappers(siren: str) -> dict | None:
    """Interroge l'API Pappers pour un SIREN donné."""
    params = {
        'api_token': API_KEY,
        'siren': siren,
        'formatted': 'true'
    }

    try:
        resp = requests.get(BASE_URL, params=params, timeout=10)
        if resp.status_code == 200:
            return resp.json()
        elif resp.status_code == 404:
            return {'error': 'not_found'}
        else:
            return {'error': f'status_{resp.status_code}', 'message': resp.text[:200]}
    except Exception as e:
        return {'error': 'exception', 'message': str(e)}


def extract_contact_info(data: dict) -> dict:
    """Extrait les informations de contact depuis la réponse Pappers."""
    if 'error' in data:
        return data

    result = {
        'telephone': None,
        'email': None,
        'site_web': None,
        'capital': None,
        'effectif': None,
        'chiffre_affaires': None,
        'resultat': None,
        'dirigeants': [],
    }

    # Téléphone et email (au niveau entreprise)
    result['telephone'] = data.get('telephone')
    result['email'] = data.get('email')
    result['site_web'] = data.get('site_web')

    # Infos financières
    result['capital'] = data.get('capital_formate')
    result['effectif'] = data.get('effectif')
    result['tranche_effectif'] = data.get('tranche_effectif')

    # Dernières finances
    finances = data.get('finances', [])
    if finances:
        last = finances[0]
        result['chiffre_affaires'] = last.get('chiffre_affaires')
        result['resultat'] = last.get('resultat')

    # Dirigeants avec contacts
    representants = data.get('representants', [])
    for rep in representants[:3]:  # Max 3 dirigeants
        dirigeant = {
            'nom': f"{rep.get('prenom', '')} {rep.get('nom', '')}".strip(),
            'qualite': rep.get('qualite'),
        }
        result['dirigeants'].append(dirigeant)

    # Établissements (peuvent avoir d'autres contacts)
    etablissements = data.get('etablissements', [])
    for etab in etablissements:
        if etab.get('telephone') and not result['telephone']:
            result['telephone'] = etab.get('telephone')
        if etab.get('email') and not result['email']:
            result['email'] = etab.get('email')

    return result


def main():
    csv_path = Path(__file__).parent.parent / 'processed' / 'plombiers_final.csv'

    print("=" * 60)
    print("ENRICHISSEMENT PAPPERS - Test sur 25 SIRENs par département")
    print("=" * 60)
    print()

    if not API_KEY:
        print("ERREUR: Clé API PAPPERS non trouvée dans .env")
        return

    print(f"Clé API: {API_KEY[:10]}...{API_KEY[-5:]}")
    print()

    # Récupérer les SIRENs sans téléphone
    sirens_by_dept = get_sirens_without_phone(csv_path, limit_per_dept=25)

    total_sirens = sum(len(s) for s in sirens_by_dept.values())
    print(f"SIRENs sans téléphone à tester: {total_sirens}")
    for dept, sirens in sorted(sirens_by_dept.items()):
        print(f"  - {dept}: {len(sirens)} SIRENs")
    print()

    # Résultats
    results = {
        'total_tested': 0,
        'with_phone': 0,
        'with_email': 0,
        'with_site_web': 0,
        'errors': 0,
        'not_found': 0,
        'details': []
    }

    for dept in sorted(sirens_by_dept.keys()):
        sirens = sirens_by_dept[dept]
        print(f"\n--- Département {dept} ({len(sirens)} SIRENs) ---")

        for i, siren in enumerate(sirens, 1):
            print(f"  [{i}/{len(sirens)}] SIREN {siren}...", end=" ", flush=True)

            data = query_pappers(siren)
            contact = extract_contact_info(data)

            results['total_tested'] += 1

            if 'error' in contact:
                if contact['error'] == 'not_found':
                    print("Non trouvé")
                    results['not_found'] += 1
                else:
                    print(f"Erreur: {contact['error']}")
                    results['errors'] += 1
                continue

            # Compter les résultats
            has_phone = bool(contact.get('telephone'))
            has_email = bool(contact.get('email'))
            has_site = bool(contact.get('site_web'))

            if has_phone:
                results['with_phone'] += 1
            if has_email:
                results['with_email'] += 1
            if has_site:
                results['with_site_web'] += 1

            status_parts = []
            if has_phone:
                status_parts.append(f"TÉL: {contact['telephone']}")
            if has_email:
                status_parts.append(f"EMAIL: {contact['email']}")
            if has_site:
                status_parts.append(f"WEB: {contact['site_web']}")

            if status_parts:
                print(" | ".join(status_parts))
            else:
                print("Aucun contact trouvé")

            results['details'].append({
                'siren': siren,
                'departement': dept,
                **contact
            })

    # Résumé
    print("\n" + "=" * 60)
    print("RÉSUMÉ")
    print("=" * 60)
    print(f"Total testé:     {results['total_tested']}")
    print(f"Non trouvés:     {results['not_found']}")
    print(f"Erreurs:         {results['errors']}")
    print(f"Avec téléphone:  {results['with_phone']} ({100*results['with_phone']/max(1,results['total_tested']-results['not_found']-results['errors']):.1f}%)")
    print(f"Avec email:      {results['with_email']} ({100*results['with_email']/max(1,results['total_tested']-results['not_found']-results['errors']):.1f}%)")
    print(f"Avec site web:   {results['with_site_web']} ({100*results['with_site_web']/max(1,results['total_tested']-results['not_found']-results['errors']):.1f}%)")

    # Sauvegarder les détails en JSON
    output_path = Path(__file__).parent.parent / 'processed' / 'pappers_test_results.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\nDétails sauvegardés dans: {output_path}")


if __name__ == '__main__':
    main()
