#!/usr/bin/env python3
"""
Scrape societe.com pour récupérer les téléphones via SIREN.
"""

import csv
import re
import time
import random
import requests
from pathlib import Path

def is_valid_french_phone(phone):
    """Vérifie si c'est un vrai numéro français."""
    if len(phone) != 10:
        return False
    # Préfixes valides: 01-05 (fixe), 06-07 (mobile), 08 (spécial), 09 (VoIP)
    prefix = phone[:2]
    if prefix in ['01', '02', '03', '04', '05', '06', '07', '08', '09']:
        return True
    # DOM: 0262/0692/0693 (Réunion), 0590/0690 (Guadeloupe), 0596/0696 (Martinique), 0594/0694 (Guyane)
    prefix3 = phone[:4]
    if prefix3 in ['0262', '0692', '0693', '0590', '0690', '0596', '0696', '0594', '0694']:
        return True
    return False

def extract_phone(html):
    """Extrait le téléphone de la page societe.com."""
    # Pattern pour téléphone affiché
    patterns = [
        r'href="tel:(\+?[\d\s.-]+)"',
        r'itemprop="telephone"[^>]*>([^<]+)<',
        r'"telephone"\s*:\s*"([^"]+)"',
        r'class="[^"]*phone[^"]*"[^>]*>([^<]+)<',
        r'>(\d{2}[\s.-]\d{2}[\s.-]\d{2}[\s.-]\d{2}[\s.-]\d{2})<',
    ]

    for pattern in patterns:
        matches = re.findall(pattern, html, re.IGNORECASE)
        for match in matches:
            # Clean
            phone = re.sub(r'[\s.-]', '', match)
            # Handle +33 or 0033
            if phone.startswith('+33'):
                phone = '0' + phone[3:]
            elif phone.startswith('0033'):
                phone = '0' + phone[4:]
            elif phone.startswith('33') and len(phone) == 11:
                phone = '0' + phone[2:]

            if is_valid_french_phone(phone):
                return phone
    return None

def scrape_societe(siren):
    """Scrape une fiche societe.com par SIREN."""
    url = f"https://www.societe.com/societe/-{siren}.html"

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9',
    }

    try:
        resp = requests.get(url, headers=headers, timeout=15, allow_redirects=True)
        if resp.status_code == 200:
            phone = extract_phone(resp.text)
            return {'phone': phone, 'error': None}
        else:
            return {'phone': None, 'error': f'HTTP {resp.status_code}'}
    except Exception as e:
        return {'phone': None, 'error': str(e)[:30]}

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit', '-l', type=int, default=100)
    args = parser.parse_args()

    base_dir = Path(__file__).parent.parent
    input_file = base_dir / 'processed/plombiers_final.csv'
    output_file = base_dir / 'processed/plombiers_final.csv'

    with open(input_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        data = list(reader)
        fieldnames = reader.fieldnames

    # Entries with SIREN but no phone
    to_scrape = [(i, r) for i, r in enumerate(data)
                 if r.get('siren') and not r.get('telephone')]

    if args.limit:
        to_scrape = to_scrape[:args.limit]

    print(f"À scraper: {len(to_scrape)}")
    print()

    found = 0
    errors = 0

    for idx, (i, row) in enumerate(to_scrape):
        siren = row.get('siren')
        name = row.get('raison_sociale', '')[:35]

        result = scrape_societe(siren)

        if result['phone']:
            data[i]['telephone'] = result['phone']
            found += 1
            print(f"[{idx+1}] {name} -> {result['phone']}")
        elif result['error']:
            errors += 1
            if idx < 10:  # Only show first errors
                print(f"[{idx+1}] {name} -> Erreur: {result['error']}")
        else:
            if idx < 20:
                print(f"[{idx+1}] {name} -> Pas de tél")

        time.sleep(random.uniform(1, 2))

        # Save periodically
        if (idx + 1) % 50 == 0:
            with open(output_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(data)
            print(f"\n  [Sauvegarde: {found} trouvés, {errors} erreurs]\n")

    # Final save
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)

    print(f"\n=== RÉSULTATS ===")
    print(f"Scrapés: {len(to_scrape)}")
    print(f"Téléphones trouvés: {found}")
    print(f"Erreurs: {errors}")

if __name__ == '__main__':
    main()
