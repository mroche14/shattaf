#!/usr/bin/env python3
"""
Search Google for phone numbers of plumbers without phone.
"""

import csv
import re
import time
import random
from pathlib import Path
from playwright.sync_api import sync_playwright

DEPT_NAMES = {
    '971': 'guadeloupe',
    '972': 'martinique', 
    '973': 'guyane',
    '974': 'reunion',
}

def extract_dom_phones(text):
    """Extract DOM phone numbers from text."""
    phones = []
    # DOM mobile: 0690/0691/0692/0693/0694/0696
    patterns = [
        r'0692\s*\d{2}\s*\d{2}\s*\d{2}\s*\d{2}',  # Réunion mobile
        r'0693\s*\d{2}\s*\d{2}\s*\d{2}\s*\d{2}',  # Réunion mobile
        r'0262\s*\d{2}\s*\d{2}\s*\d{2}\s*\d{2}',  # Réunion fixe
        r'0690\s*\d{2}\s*\d{2}\s*\d{2}\s*\d{2}',  # Guadeloupe mobile
        r'0691\s*\d{2}\s*\d{2}\s*\d{2}\s*\d{2}',  # Guadeloupe mobile
        r'0590\s*\d{2}\s*\d{2}\s*\d{2}\s*\d{2}',  # Guadeloupe fixe
        r'0696\s*\d{2}\s*\d{2}\s*\d{2}\s*\d{2}',  # Martinique mobile
        r'0596\s*\d{2}\s*\d{2}\s*\d{2}\s*\d{2}',  # Martinique fixe
        r'0694\s*\d{2}\s*\d{2}\s*\d{2}\s*\d{2}',  # Guyane mobile
        r'0594\s*\d{2}\s*\d{2}\s*\d{2}\s*\d{2}',  # Guyane fixe
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, text)
        for m in matches:
            clean = re.sub(r'\s', '', m)
            if len(clean) == 10:
                phones.append(clean)
    
    return list(set(phones))

def search_google(page, name, dept):
    """Search Google for company phone."""
    dept_name = DEPT_NAMES.get(dept, '')
    query = f"{name} {dept_name} plombier téléphone"
    
    # Navigate to Google
    page.goto(f"https://www.google.com/search?q={query}&hl=fr")
    time.sleep(random.uniform(2, 3))
    
    # Get page content
    content = page.content()
    
    # Extract phones
    phones = extract_dom_phones(content)
    return phones

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit', '-l', type=int, default=20)
    args = parser.parse_args()

    base_dir = Path(__file__).parent.parent
    input_file = base_dir / 'processed/plombiers_final.csv'
    output_file = base_dir / 'processed/plombiers_final.csv'

    with open(input_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        data = list(reader)
        fieldnames = reader.fieldnames

    # Find entries without phone
    to_search = [(i, r) for i, r in enumerate(data) 
                 if r.get('raison_sociale') and not r.get('telephone')]
    
    if args.limit:
        to_search = to_search[:args.limit]

    print(f"À chercher: {len(to_search)}")
    
    found = 0
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            locale='fr-FR'
        )
        page = context.new_page()
        
        for idx, (i, row) in enumerate(to_search):
            name = row.get('raison_sociale', '')
            dept = row.get('departement', '') or row.get('code_postal', '')[:3]
            
            print(f"[{idx+1}/{len(to_search)}] {name[:40]}...")
            
            try:
                phones = search_google(page, name, dept)
                
                if phones:
                    data[i]['telephone'] = phones[0]
                    found += 1
                    print(f"    -> {phones[0]}")
                else:
                    print(f"    -> Pas de tél")
                    
            except Exception as e:
                print(f"    -> Erreur: {str(e)[:30]}")
            
            time.sleep(random.uniform(3, 5))
            
            # Save periodically
            if (idx + 1) % 10 == 0:
                with open(output_file, 'w', newline='', encoding='utf-8') as f:
                    writer = csv.DictWriter(f, fieldnames=fieldnames)
                    writer.writeheader()
                    writer.writerows(data)
                print(f"\n  [Sauvegarde: {found} trouvés]\n")
        
        browser.close()

    # Final save
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)

    print(f"\n=== RÉSULTATS ===")
    print(f"Cherchés: {len(to_search)}")
    print(f"Trouvés: {found}")

if __name__ == '__main__':
    main()
