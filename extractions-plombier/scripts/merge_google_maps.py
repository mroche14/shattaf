#!/usr/bin/env python3
"""
Fusionne les données Google Maps avec le dataset plombiers_final.csv
Enrichit les entrées existantes avec téléphones et ajoute les nouvelles.
"""

import csv
import re
from pathlib import Path
from datetime import datetime
from difflib import SequenceMatcher

def normalize_phone(phone: str) -> str:
    """Normalise un numéro de téléphone pour comparaison."""
    if not phone:
        return ''
    # Garder seulement les chiffres
    digits = re.sub(r'\D', '', phone)
    # Normaliser les préfixes DOM
    if digits.startswith('33'):
        digits = '0' + digits[2:]
    elif digits.startswith('590'):
        digits = '0' + digits[3:]
    elif digits.startswith('596'):
        digits = '0' + digits[3:]
    elif digits.startswith('594'):
        digits = '0' + digits[3:]
    elif digits.startswith('262'):
        digits = '0' + digits[3:]
    return digits

def normalize_name(name: str) -> str:
    """Normalise un nom pour comparaison."""
    if not name:
        return ''
    # Lowercase, remove accents, special chars
    name = name.lower()
    name = re.sub(r'[^\w\s]', '', name)
    name = ' '.join(name.split())
    # Remove common words
    for word in ['sarl', 'sas', 'eurl', 'sasu', 'eirl', 'ei', 'plomberie', 'plombier']:
        name = name.replace(word, '')
    return name.strip()

def similarity(a: str, b: str) -> float:
    """Calcule la similarité entre deux chaînes."""
    return SequenceMatcher(None, a, b).ratio()

def main():
    base_dir = Path(__file__).parent.parent

    # Charger le dataset existant
    existing_file = base_dir / 'processed' / 'plombiers_final.csv'
    gmap_files = list((base_dir / 'raw' / 'google_maps').glob('google_maps_plombiers_*.csv'))

    if not gmap_files:
        print("Aucun fichier Google Maps trouvé")
        return

    gmap_file = sorted(gmap_files)[-1]  # Le plus récent

    print(f"Dataset existant: {existing_file}")
    print(f"Google Maps: {gmap_file}")
    print()

    # Charger les données existantes
    existing = []
    with open(existing_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        existing = list(reader)

    print(f"Entrées existantes: {len(existing)}")

    # Index par téléphone normalisé
    phone_index = {}
    for i, row in enumerate(existing):
        for tel_field in ['telephone', 'telephone_2']:
            phone = normalize_phone(row.get(tel_field, ''))
            if phone and len(phone) >= 9:
                phone_index[phone] = i

    # Index par nom normalisé + département
    name_index = {}
    for i, row in enumerate(existing):
        name = normalize_name(row.get('raison_sociale', ''))
        dept = row.get('departement', '')
        if name and dept:
            key = f"{dept}:{name}"
            name_index[key] = i

    # Charger Google Maps
    gmap_data = []
    with open(gmap_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        gmap_data = list(reader)

    print(f"Entrées Google Maps: {len(gmap_data)}")
    print()

    # Stats
    stats = {
        'matched_by_phone': 0,
        'matched_by_name': 0,
        'enriched_phone': 0,
        'enriched_site': 0,
        'enriched_note': 0,
        'new_entries': 0,
    }

    new_entries = []

    for gmap in gmap_data:
        # Extraire le département de la ville de recherche
        ville = gmap.get('ville_recherche', '')
        if 'Guadeloupe' in ville:
            dept = '971'
        elif 'Martinique' in ville:
            dept = '972'
        elif 'Guyane' in ville:
            dept = '973'
        elif 'Réunion' in ville:
            dept = '974'
        else:
            continue

        gmap_phone = normalize_phone(gmap.get('telephone', ''))
        gmap_name = normalize_name(gmap.get('nom', ''))

        matched_idx = None

        # Chercher par téléphone
        if gmap_phone and gmap_phone in phone_index:
            matched_idx = phone_index[gmap_phone]
            stats['matched_by_phone'] += 1

        # Chercher par nom + département
        if matched_idx is None and gmap_name:
            key = f"{dept}:{gmap_name}"
            if key in name_index:
                matched_idx = name_index[key]
                stats['matched_by_name'] += 1
            else:
                # Recherche fuzzy
                for existing_key, idx in name_index.items():
                    if existing_key.startswith(dept + ':'):
                        existing_name = existing_key.split(':', 1)[1]
                        if similarity(gmap_name, existing_name) > 0.7:
                            matched_idx = idx
                            stats['matched_by_name'] += 1
                            break

        if matched_idx is not None:
            # Enrichir l'entrée existante
            row = existing[matched_idx]

            # Ajouter téléphone si manquant
            if gmap_phone and not row.get('telephone'):
                row['telephone'] = gmap.get('telephone', '')
                stats['enriched_phone'] += 1
            elif gmap_phone and not row.get('telephone_2') and gmap_phone != normalize_phone(row.get('telephone', '')):
                row['telephone_2'] = gmap.get('telephone', '')

            # Ajouter site web si manquant
            if gmap.get('site_web') and not row.get('site_web'):
                row['site_web'] = gmap.get('site_web', '')
                stats['enriched_site'] += 1

            # Ajouter note/avis si manquant
            if gmap.get('note') and not row.get('note_avis'):
                row['note_avis'] = gmap.get('note', '')
                row['nb_avis'] = gmap.get('nb_avis', '')
                stats['enriched_note'] += 1

            # Marquer la source
            sources = row.get('sources', '')
            if 'google_maps' not in sources:
                row['sources'] = sources + ',google_maps' if sources else 'google_maps'

        else:
            # Nouvelle entrée
            new_entry = {
                'siren': '',
                'siret': '',
                'raison_sociale': gmap.get('nom', ''),
                'nom_dirigeant': '',
                'prenom_dirigeant': '',
                'code_ape': '43.22A',
                'forme_juridique': '',
                'adresse': gmap.get('adresse', '').replace('Adresse: ', ''),
                'code_postal': '',
                'ville': '',
                'departement': dept,
                'telephone': gmap.get('telephone', ''),
                'telephone_2': '',
                'email': '',
                'site_web': gmap.get('site_web', ''),
                'date_creation': '',
                'certifications': '',
                'note_avis': gmap.get('note', ''),
                'nb_avis': gmap.get('nb_avis', ''),
                'statut': 'ACTIF',
                'individuel': '',
                'provenance': 'GOOGLE_MAPS',
                'sources': 'google_maps',
                'date_extraction': datetime.now().strftime('%Y-%m-%d'),
            }
            new_entries.append(new_entry)
            stats['new_entries'] += 1

    # Ajouter les nouvelles entrées
    all_data = existing + new_entries

    # Sauvegarder
    output_file = base_dir / 'processed' / 'plombiers_final_enriched.csv'
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        fieldnames = existing[0].keys()
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_data)

    print("=== RÉSULTATS FUSION ===")
    print(f"Matchés par téléphone: {stats['matched_by_phone']}")
    print(f"Matchés par nom: {stats['matched_by_name']}")
    print(f"Téléphones enrichis: {stats['enriched_phone']}")
    print(f"Sites web enrichis: {stats['enriched_site']}")
    print(f"Notes enrichies: {stats['enriched_note']}")
    print(f"Nouvelles entrées: {stats['new_entries']}")
    print()
    print(f"Total final: {len(all_data)}")
    print(f"Fichier: {output_file}")

    # Stats téléphones
    with_phone = sum(1 for d in all_data if d.get('telephone'))
    print(f"\nAvec téléphone: {with_phone}/{len(all_data)} ({100*with_phone/len(all_data):.1f}%)")

if __name__ == '__main__':
    main()
