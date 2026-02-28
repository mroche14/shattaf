#!/usr/bin/env python3
"""
Google Maps Scraper - Stealth Mode
Extrait les plombiers des DOM (971, 972, 973, 974) avec téléphones.

Sources:
- https://github.com/HasData/google-maps-scraper
- https://dev.to/hasdata_com/simple-google-maps-scraper-using-playwright-e72
"""

import csv
import json
import random
import re
import time
from datetime import datetime
from pathlib import Path

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
from playwright_stealth import Stealth

# Configuration
CONFIG = {
    'headless': True,   # True pour production
    'slow_mo': 50,      # Ralentir les actions (ms)
    'max_results_per_search': 200,  # Limite haute pour ne pas rater de résultats
    'scroll_pause_min': 1.0,
    'scroll_pause_max': 2.0,
    'click_pause_min': 1.5,
    'click_pause_max': 3.0,
}

# Villes principales des DOM à scraper
DOM_CITIES = {
    '971': [  # Guadeloupe
        'Pointe-à-Pitre, Guadeloupe',
        'Les Abymes, Guadeloupe',
        'Baie-Mahault, Guadeloupe',
        'Le Gosier, Guadeloupe',
        'Petit-Bourg, Guadeloupe',
        'Sainte-Anne, Guadeloupe',
        'Le Moule, Guadeloupe',
        'Capesterre-Belle-Eau, Guadeloupe',
        'Basse-Terre, Guadeloupe',
    ],
    '972': [  # Martinique
        'Fort-de-France, Martinique',
        'Le Lamentin, Martinique',
        'Le Robert, Martinique',
        'Schoelcher, Martinique',
        'Sainte-Marie, Martinique',
        'Le François, Martinique',
        'Ducos, Martinique',
        'Rivière-Salée, Martinique',
    ],
    '973': [  # Guyane
        'Cayenne, Guyane',
        'Matoury, Guyane',
        'Saint-Laurent-du-Maroni, Guyane',
        'Kourou, Guyane',
        'Rémire-Montjoly, Guyane',
    ],
    '974': [  # La Réunion
        'Saint-Denis, La Réunion',
        'Saint-Paul, La Réunion',
        'Saint-Pierre, La Réunion',
        'Le Tampon, La Réunion',
        'Saint-André, La Réunion',
        'Saint-Louis, La Réunion',
        'Le Port, La Réunion',
        'Saint-Benoît, La Réunion',
    ],
}


def random_delay(min_sec: float, max_sec: float):
    """Pause aléatoire pour simuler comportement humain."""
    time.sleep(random.uniform(min_sec, max_sec))


def extract_phone(text: str) -> str | None:
    """Extrait un numéro de téléphone français du texte."""
    if not text:
        return None
    # Patterns pour numéros français (métropole et DOM)
    patterns = [
        r'(\+33[\s.-]?\d[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2})',
        r'(\+590[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2})',
        r'(\+596[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2})',
        r'(\+594[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2})',
        r'(\+262[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2})',
        r'(0[\s.-]?[1-9][\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2})',
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            # Nettoyer le numéro
            phone = re.sub(r'[\s.-]', '', match.group(1))
            return phone
    return None


def clean_text(text: str | None) -> str:
    """Nettoie le texte extrait."""
    if not text:
        return ''
    return ' '.join(text.split()).strip()


class GoogleMapsScraper:
    def __init__(self, output_dir: Path):
        self.output_dir = output_dir
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.results = []
        self.seen_names = set()

    def accept_cookies(self, page):
        """Accepte les cookies Google si le dialogue apparaît."""
        try:
            # Chercher le bouton "Tout accepter" en français
            accept_btn = page.locator('button:has-text("Tout accepter")')
            if accept_btn.count() > 0:
                accept_btn.first.click()
                random_delay(1, 2)
                print("  Cookies acceptés")
        except Exception:
            pass

    def search_plombiers(self, page, city: str) -> int:
        """Recherche les plombiers dans une ville."""
        query = f"plombier {city}"
        print(f"\n  Recherche: {query}")

        # Utiliser directement l'URL de recherche (plus fiable)
        import urllib.parse
        encoded_query = urllib.parse.quote(query)
        url = f'https://www.google.com/maps/search/{encoded_query}'
        page.goto(url, wait_until='domcontentloaded', timeout=60000)
        random_delay(3, 5)

        # Accepter cookies si nécessaire
        self.accept_cookies(page)
        random_delay(2, 3)

        return self.scroll_and_extract(page, city)

    def scroll_and_extract(self, page, city: str) -> int:
        """Scroll les résultats et extrait les données."""
        count = 0

        try:
            # Attendre que la page charge
            page.wait_for_selector('div[role="feed"]', timeout=15000)

            # Trouver le panneau des résultats
            results_panel = page.locator('div[role="feed"]')
            if results_panel.count() == 0:
                print("  Pas de panneau de résultats trouvé")
                return 0

            # Scroll pour charger plus de résultats
            last_count = 0
            scroll_attempts = 0
            max_scroll_attempts = 30  # Plus de tentatives pour être exhaustif

            while scroll_attempts < max_scroll_attempts:
                # Récupérer les cartes de résultats
                cards = page.locator('div[role="feed"] > div > div[jsaction]')
                current_count = cards.count()

                if current_count >= CONFIG['max_results_per_search']:
                    print(f"  Max résultats atteint ({current_count})")
                    break

                # Scroll down
                results_panel.evaluate('el => el.scrollTop = el.scrollHeight')
                random_delay(CONFIG['scroll_pause_min'], CONFIG['scroll_pause_max'])

                # Vérifier si on a atteint la fin (plus de nouveaux résultats)
                new_count = cards.count()
                if new_count == last_count:
                    scroll_attempts += 1
                    # Vérifier si on voit le message de fin
                    end_msg = page.locator('text="Vous êtes arrivé à la fin de la liste"')
                    if end_msg.count() > 0:
                        print("  Fin de la liste atteinte")
                        break
                else:
                    scroll_attempts = 0
                last_count = new_count

            # Extraire les données de chaque carte
            cards = page.locator('div[role="feed"] > div > div[jsaction]')
            total_cards = min(cards.count(), CONFIG['max_results_per_search'])
            print(f"  {total_cards} résultats trouvés")

            for i in range(total_cards):
                try:
                    card = cards.nth(i)
                    data = self.extract_card_data(page, card, city, i)
                    if data and data['nom'] not in self.seen_names:
                        self.seen_names.add(data['nom'])
                        self.results.append(data)
                        count += 1

                        status = f"TEL: {data['telephone']}" if data['telephone'] else "pas de tel"
                        print(f"    [{i+1}/{total_cards}] {data['nom'][:40]} - {status}")
                except Exception as e:
                    print(f"    [{i+1}/{total_cards}] Erreur: {str(e)[:50]}")
                    continue

        except Exception as e:
            print(f"  Erreur scroll: {e}")

        return count

    def extract_card_data(self, page, card, city: str, index: int) -> dict | None:
        """Extrait les données d'une carte de résultat."""
        try:
            # Cliquer sur la carte pour voir les détails
            card.click()
            random_delay(CONFIG['click_pause_min'], CONFIG['click_pause_max'])

            # Attendre que le panneau de détails charge
            page.wait_for_selector('div[role="main"]', timeout=5000)

            data = {
                'nom': '',
                'adresse': '',
                'telephone': '',
                'site_web': '',
                'note': '',
                'nb_avis': '',
                'categorie': '',
                'horaires': '',
                'ville_recherche': city,
                'date_extraction': datetime.now().isoformat(),
                'source': 'google_maps',
            }

            # Nom - chercher dans le panneau de détails
            try:
                # Le nom est dans le h1 du panneau principal, mais pas celui de la page
                name_el = page.locator('div[role="main"] h1').first
                name = clean_text(name_el.text_content())
                # Filtrer les noms génériques
                if name and name not in ['Résultats', 'Google Maps']:
                    data['nom'] = name
            except:
                pass

            # Fallback: titre de l'aria-label du panneau
            if not data['nom']:
                try:
                    main_panel = page.locator('div[role="main"][aria-label]').first
                    aria = main_panel.get_attribute('aria-label') or ''
                    if aria and 'Résultats' not in aria:
                        data['nom'] = clean_text(aria)
                except:
                    pass

            # Note et avis
            try:
                rating_el = page.locator('div[role="main"] span[role="img"]').first
                aria = rating_el.get_attribute('aria-label') or ''
                # "4,5 étoiles 123 avis"
                match = re.search(r'([\d,]+)\s*[ée]toile', aria)
                if match:
                    data['note'] = match.group(1).replace(',', '.')
                match = re.search(r'(\d+)\s*avis', aria)
                if match:
                    data['nb_avis'] = match.group(1)
            except:
                pass

            # Catégorie
            try:
                cat_el = page.locator('button[jsaction*="category"]').first
                data['categorie'] = clean_text(cat_el.text_content())
            except:
                pass

            # Adresse - chercher dans les boutons d'info
            try:
                # L'adresse est souvent dans un bouton avec l'icône de localisation
                address_btn = page.locator('button[data-item-id="address"]')
                if address_btn.count() > 0:
                    data['adresse'] = clean_text(address_btn.first.get_attribute('aria-label') or '')
            except:
                pass

            # Téléphone - méthode 1: bouton avec data-item-id
            try:
                phone_btn = page.locator('button[data-item-id^="phone:"]')
                if phone_btn.count() > 0:
                    aria = phone_btn.first.get_attribute('aria-label') or ''
                    data['telephone'] = extract_phone(aria)
            except:
                pass

            # Téléphone - méthode 2: chercher dans tout le contenu
            if not data['telephone']:
                try:
                    main_content = page.locator('div[role="main"]').first.text_content()
                    data['telephone'] = extract_phone(main_content or '')
                except:
                    pass

            # Site web
            try:
                website_btn = page.locator('a[data-item-id="authority"]')
                if website_btn.count() > 0:
                    data['site_web'] = website_btn.first.get_attribute('href') or ''
            except:
                pass

            # Horaires
            try:
                hours_btn = page.locator('button[data-item-id*="oh"]')
                if hours_btn.count() > 0:
                    data['horaires'] = clean_text(hours_btn.first.get_attribute('aria-label') or '')
            except:
                pass

            if data['nom']:
                return data
            return None

        except PlaywrightTimeout:
            return None
        except Exception as e:
            return None

    def save_results(self):
        """Sauvegarde les résultats en CSV et JSON."""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

        # CSV
        csv_path = self.output_dir / f'google_maps_plombiers_{timestamp}.csv'
        if self.results:
            with open(csv_path, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=self.results[0].keys())
                writer.writeheader()
                writer.writerows(self.results)
            print(f"\nCSV sauvegardé: {csv_path}")

        # JSON
        json_path = self.output_dir / f'google_maps_plombiers_{timestamp}.json'
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, ensure_ascii=False, indent=2)
        print(f"JSON sauvegardé: {json_path}")

        return csv_path, json_path

    def run(self, departments: list[str] | None = None):
        """Lance le scraping pour les départements spécifiés."""
        if departments is None:
            departments = list(DOM_CITIES.keys())

        print("=" * 60)
        print("GOOGLE MAPS SCRAPER - PLOMBIERS DOM")
        print("=" * 60)
        print(f"Départements: {', '.join(departments)}")
        print(f"Mode: {'headless' if CONFIG['headless'] else 'visible'}")
        print()

        with sync_playwright() as p:
            # Lancer le navigateur avec options stealth
            browser = p.chromium.launch(
                headless=CONFIG['headless'],
                slow_mo=CONFIG['slow_mo'],
                args=[
                    '--disable-blink-features=AutomationControlled',
                    '--disable-dev-shm-usage',
                    '--no-sandbox',
                ]
            )

            # Contexte avec user-agent réaliste
            context = browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                locale='fr-FR',
                timezone_id='Europe/Paris',
            )

            page = context.new_page()

            # Appliquer stealth
            stealth = Stealth()
            stealth.apply_stealth_sync(page)

            total_extracted = 0

            for dept in departments:
                cities = DOM_CITIES.get(dept, [])
                print(f"\n{'='*60}")
                print(f"DÉPARTEMENT {dept} ({len(cities)} villes)")
                print('='*60)

                for city in cities:
                    retries = 2
                    for attempt in range(retries):
                        try:
                            count = self.search_plombiers(page, city)
                            total_extracted += count
                            print(f"  -> {count} nouveaux plombiers extraits")
                            break

                        except Exception as e:
                            if attempt < retries - 1:
                                print(f"  Tentative {attempt+1} échouée, retry dans 10s...")
                                random_delay(8, 12)
                            else:
                                print(f"  ERREUR pour {city}: {str(e)[:80]}")

                    # Pause plus longue entre les recherches pour éviter le blocage
                    random_delay(8, 15)

            browser.close()

        # Sauvegarder
        print(f"\n{'='*60}")
        print(f"TOTAL: {total_extracted} plombiers uniques extraits")
        print('='*60)

        csv_path, json_path = self.save_results()

        # Stats téléphones
        with_phone = sum(1 for r in self.results if r.get('telephone'))
        print(f"\nAvec téléphone: {with_phone}/{len(self.results)} ({100*with_phone/max(1,len(self.results)):.1f}%)")

        return self.results


def main():
    """Point d'entrée principal."""
    import argparse

    parser = argparse.ArgumentParser(description='Google Maps Scraper pour plombiers DOM')
    parser.add_argument('--dept', nargs='+', choices=['971', '972', '973', '974'],
                       help='Départements à scraper (par défaut: tous)')
    parser.add_argument('--headless', action='store_true',
                       help='Mode headless (sans fenêtre)')
    parser.add_argument('--max-results', type=int, default=50,
                       help='Nombre max de résultats par recherche')
    args = parser.parse_args()

    if args.headless:
        CONFIG['headless'] = True
    if args.max_results:
        CONFIG['max_results_per_search'] = args.max_results

    output_dir = Path(__file__).parent.parent / 'raw' / 'google_maps'
    scraper = GoogleMapsScraper(output_dir)
    scraper.run(args.dept)


if __name__ == '__main__':
    main()
