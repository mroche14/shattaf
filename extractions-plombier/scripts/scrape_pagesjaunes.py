#!/usr/bin/env python3
"""
Scraper Pages Jaunes pour enrichir les données plombiers DOM.

Usage:
    python scrape_pagesjaunes.py
    python scrape_pagesjaunes.py --departement 971
    python scrape_pagesjaunes.py --max-pages 3
"""

import argparse
import csv
import json
import os
import random
import re
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

# Configuration
BASE_URL = "https://www.pagesjaunes.fr"
SEARCH_URL = "https://www.pagesjaunes.fr/annuaire/chercherlespros"

# Départements DOM et leurs noms pour la recherche
DEPARTEMENTS = {
    '971': 'guadeloupe',
    '972': 'martinique',
    '973': 'guyane',
    '974': 'la-reunion',
}

# Headers pour simuler un navigateur
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
}

# Colonnes du CSV de sortie
OUTPUT_COLUMNS = [
    'nom',
    'adresse',
    'code_postal',
    'ville',
    'departement',
    'telephone_1',
    'telephone_2',
    'site_web',
    'siren',
    'siret',
    'code_naf',
    'date_creation',
    'effectif',
    'note_pj',
    'nb_avis_pj',
    'url_pagesjaunes',
    'date_extraction',
]


class PagesJaunesScraper:
    """Scraper pour Pages Jaunes."""

    def __init__(self, delay_min: float = 2.0, delay_max: float = 5.0):
        self.session = requests.Session()
        self.session.headers.update(HEADERS)
        self.delay_min = delay_min
        self.delay_max = delay_max
        self.results: List[Dict] = []

    def _wait(self):
        """Attend un délai aléatoire entre les requêtes."""
        delay = random.uniform(self.delay_min, self.delay_max)
        time.sleep(delay)

    def _get_page(self, url: str) -> Optional[BeautifulSoup]:
        """Récupère et parse une page."""
        try:
            self._wait()
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            return BeautifulSoup(response.text, 'html.parser')
        except requests.RequestException as e:
            print(f"  Erreur requête {url}: {e}")
            return None

    def _extract_phone_from_onclick(self, element) -> Optional[str]:
        """Extrait le numéro depuis un attribut onclick ou data."""
        # Pages Jaunes cache souvent les numéros
        # On essaie différentes méthodes
        if element.get('data-numtel'):
            return element.get('data-numtel')
        return None

    def _parse_listing(self, item) -> Optional[Dict]:
        """Parse un élément de liste de résultats."""
        try:
            result = {col: None for col in OUTPUT_COLUMNS}
            result['date_extraction'] = datetime.now().strftime('%Y-%m-%d')

            # Nom
            name_elem = item.select_one('h3 a, h3')
            if name_elem:
                result['nom'] = name_elem.get_text(strip=True)

            # URL de la fiche
            link_elem = item.select_one('a[href*="/pros/"]')
            if link_elem:
                href = link_elem.get('href', '')
                if href.startswith('/'):
                    result['url_pagesjaunes'] = urljoin(BASE_URL, href)
                else:
                    result['url_pagesjaunes'] = href

            # Adresse
            addr_elem = item.select_one('[class*="adresse"], [class*="address"]')
            if addr_elem:
                addr_text = addr_elem.get_text(strip=True)
                # Extraire code postal et ville
                cp_match = re.search(r'(97\d{3})\s+(.+?)(?:\s+Voir|$)', addr_text)
                if cp_match:
                    result['code_postal'] = cp_match.group(1)
                    result['ville'] = cp_match.group(2).strip()
                    result['departement'] = cp_match.group(1)[:3]
                result['adresse'] = re.sub(r'\s+Voir.*$', '', addr_text).strip()

            # Note et avis
            note_elem = item.select_one('[class*="note"], [title*="Note"]')
            if note_elem:
                note_text = note_elem.get_text(strip=True)
                note_match = re.search(r'(\d+(?:[.,]\d+)?)', note_text)
                if note_match:
                    result['note_pj'] = note_match.group(1).replace(',', '.')

            avis_elem = item.select_one('[class*="avis"] a, a[href*="avis"]')
            if avis_elem:
                avis_text = avis_elem.get_text(strip=True)
                avis_match = re.search(r'(\d+)\s*avis', avis_text)
                if avis_match:
                    result['nb_avis_pj'] = avis_match.group(1)

            return result if result['nom'] else None

        except Exception as e:
            print(f"  Erreur parsing listing: {e}")
            return None

    def _parse_detail_page(self, url: str) -> Dict:
        """Parse une page de détail pour enrichir les données."""
        enriched = {}
        soup = self._get_page(url)
        if not soup:
            return enriched

        try:
            # Téléphones - chercher dans différents endroits
            phone_elems = soup.select('[class*="tel"], [class*="phone"], [data-numtel]')
            phones = []
            for elem in phone_elems:
                text = elem.get_text(strip=True)
                # Format téléphone français
                phone_match = re.search(r'0[1-9](?:[\s.]?\d{2}){4}', text)
                if phone_match:
                    phone = re.sub(r'[\s.]', '', phone_match.group())
                    if phone not in phones:
                        phones.append(phone)

            if len(phones) >= 1:
                enriched['telephone_1'] = phones[0]
            if len(phones) >= 2:
                enriched['telephone_2'] = phones[1]

            # Site web
            site_elem = soup.select_one('a[href*="http"]:has(> *:contains("Site web")), a:contains("Site web")')
            if not site_elem:
                # Chercher autrement
                for a in soup.select('a[href^="http"]'):
                    href = a.get('href', '')
                    if 'pagesjaunes' not in href and 'solocal' not in href:
                        text = a.get_text(strip=True).lower()
                        if 'site' in text or 'web' in text:
                            enriched['site_web'] = href
                            break

            # Infos juridiques (SIREN, SIRET, NAF)
            # Chercher dans la section "Informations financières"
            legal_section = soup.select_one('[class*="juridique"], [class*="legal"], [class*="financ"]')
            if legal_section:
                text = legal_section.get_text()

                siren_match = re.search(r'SIREN[:\s]*(\d{9})', text, re.IGNORECASE)
                if siren_match:
                    enriched['siren'] = siren_match.group(1)

                siret_match = re.search(r'SIRET[:\s]*(\d{14})', text, re.IGNORECASE)
                if siret_match:
                    enriched['siret'] = siret_match.group(1)

                naf_match = re.search(r'(?:NAF|APE)[:\s]*(\d{4}[A-Z])', text, re.IGNORECASE)
                if naf_match:
                    enriched['code_naf'] = naf_match.group(1)

                # Date création
                date_match = re.search(r'Création[^:]*:\s*(\d{1,2}\s+\w+\s+\d{4})', text, re.IGNORECASE)
                if date_match:
                    enriched['date_creation'] = date_match.group(1)

                # Effectif
                eff_match = re.search(r'Effectif[^:]*:\s*(\d+\s*salarié)', text, re.IGNORECASE)
                if eff_match:
                    enriched['effectif'] = eff_match.group(1)

            # Aussi chercher dans des balises dt/dd
            for dt in soup.select('dt'):
                dt_text = dt.get_text(strip=True).upper()
                dd = dt.find_next_sibling('dd')
                if dd:
                    dd_text = dd.get_text(strip=True)
                    if 'SIREN' in dt_text and not enriched.get('siren'):
                        siren = re.sub(r'\D', '', dd_text)
                        if len(siren) == 9:
                            enriched['siren'] = siren
                    elif 'SIRET' in dt_text and not enriched.get('siret'):
                        siret = re.sub(r'\D', '', dd_text)
                        if len(siret) == 14:
                            enriched['siret'] = siret
                    elif 'NAF' in dt_text or 'APE' in dt_text:
                        naf_match = re.search(r'(\d{4}[A-Z])', dd_text)
                        if naf_match:
                            enriched['code_naf'] = naf_match.group(1)

        except Exception as e:
            print(f"  Erreur parsing détail: {e}")

        return enriched

    def search_department(self, dept_code: str, max_pages: int = 100, enrich: bool = True) -> List[Dict]:
        """Recherche tous les plombiers d'un département."""
        dept_name = DEPARTEMENTS.get(dept_code)
        if not dept_name:
            print(f"Département inconnu: {dept_code}")
            return []

        print(f"\n{'='*60}")
        print(f"Recherche plombiers en {dept_name.upper()} ({dept_code})")
        print(f"{'='*60}")

        results = []
        page = 1

        while page <= max_pages:
            # Construire l'URL
            if page == 1:
                url = f"{SEARCH_URL}?quoiqui=plombier&ou={dept_name}"
            else:
                url = f"{SEARCH_URL}?quoiqui=plombier&ou={dept_name}&page={page}"

            print(f"\nPage {page}: {url}")

            soup = self._get_page(url)
            if not soup:
                print("  Impossible de charger la page")
                break

            # Vérifier s'il y a des résultats
            no_results = soup.select_one('[class*="no-result"], [class*="aucun"]')
            if no_results:
                print("  Aucun résultat")
                break

            # Trouver les items de liste
            items = soup.select('li[class*="bi-"], li[data-id], article[class*="result"]')
            if not items:
                # Essayer d'autres sélecteurs
                items = soup.select('[class*="liste"] > li, [class*="results"] li')

            if not items:
                print("  Aucun item trouvé sur cette page")
                break

            print(f"  {len(items)} résultats trouvés")

            for item in items:
                data = self._parse_listing(item)
                if data:
                    results.append(data)
                    print(f"    + {data['nom']}")

            # Vérifier s'il y a une page suivante
            next_link = soup.select_one('a[rel="next"], a:contains("Suivant"), [class*="pagination"] a[href*="page="]')
            if not next_link:
                # Vérifier via le texte de pagination
                pagination = soup.select_one('[class*="pagination"]')
                if pagination:
                    text = pagination.get_text()
                    current_match = re.search(rf'Page\s*{page}\s*/\s*(\d+)', text)
                    if current_match:
                        total_pages = int(current_match.group(1))
                        if page >= total_pages:
                            print("  Dernière page atteinte")
                            break
                    else:
                        print("  Pas de page suivante détectée")
                        break
                else:
                    print("  Pas de pagination trouvée")
                    break

            page += 1

        print(f"\nTotal: {len(results)} professionnels trouvés")

        # Enrichissement avec les pages de détail
        if enrich and results:
            print(f"\nEnrichissement des {len(results)} fiches...")
            for i, result in enumerate(results):
                if result.get('url_pagesjaunes'):
                    print(f"  [{i+1}/{len(results)}] {result['nom']}")
                    enriched = self._parse_detail_page(result['url_pagesjaunes'])
                    result.update({k: v for k, v in enriched.items() if v})

        return results

    def search_all_departments(self, max_pages: int = 100, enrich: bool = True) -> List[Dict]:
        """Recherche dans tous les départements DOM."""
        all_results = []
        for dept_code in DEPARTEMENTS:
            results = self.search_department(dept_code, max_pages, enrich)
            all_results.extend(results)
        return all_results


def save_results(results: List[Dict], output_path: Path):
    """Sauvegarde les résultats en CSV."""
    with open(output_path, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=OUTPUT_COLUMNS, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(results)
    print(f"\nSauvegardé: {output_path} ({len(results)} lignes)")


def main():
    parser = argparse.ArgumentParser(description='Scrape Pages Jaunes pour plombiers DOM')
    parser.add_argument('--departement', '-d', help='Code département (971-974)')
    parser.add_argument('--max-pages', '-p', type=int, default=20, help='Nombre max de pages par département')
    parser.add_argument('--no-enrich', action='store_true', help='Ne pas enrichir avec les pages de détail')
    parser.add_argument('--output', '-o', help='Fichier de sortie')
    parser.add_argument('--delay-min', type=float, default=2.0, help='Délai minimum entre requêtes (secondes)')
    parser.add_argument('--delay-max', type=float, default=5.0, help='Délai maximum entre requêtes (secondes)')
    args = parser.parse_args()

    # Chemins
    base_dir = Path(__file__).parent.parent
    raw_dir = base_dir / 'raw'

    # Scraper
    scraper = PagesJaunesScraper(delay_min=args.delay_min, delay_max=args.delay_max)

    # Recherche
    if args.departement:
        results = scraper.search_department(
            args.departement,
            max_pages=args.max_pages,
            enrich=not args.no_enrich
        )
        default_output = f"pagesjaunes_{args.departement}.csv"
    else:
        results = scraper.search_all_departments(
            max_pages=args.max_pages,
            enrich=not args.no_enrich
        )
        default_output = "pagesjaunes_all.csv"

    # Sauvegarde
    output_path = raw_dir / (args.output or default_output)
    save_results(results, output_path)

    # Stats
    print(f"\n{'='*60}")
    print("STATISTIQUES")
    print(f"{'='*60}")
    print(f"Total professionnels: {len(results)}")

    with_phone = sum(1 for r in results if r.get('telephone_1'))
    print(f"Avec téléphone: {with_phone} ({100*with_phone//len(results) if results else 0}%)")

    with_siren = sum(1 for r in results if r.get('siren'))
    print(f"Avec SIREN: {with_siren} ({100*with_siren//len(results) if results else 0}%)")

    by_dept = {}
    for r in results:
        dept = r.get('departement') or 'Inconnu'
        by_dept[dept] = by_dept.get(dept, 0) + 1
    print("\nPar département:")
    for dept, count in sorted(by_dept.items()):
        print(f"  {dept}: {count}")


if __name__ == '__main__':
    main()
