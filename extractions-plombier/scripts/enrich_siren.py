#!/usr/bin/env python3
"""
Enrichit les entrées sans SIREN en cherchant sur annuaire-entreprises.data.gouv.fr
Récupère le SIREN et la forme juridique.
"""

import csv
import json
import re
import time
import random
from pathlib import Path
from datetime import datetime
from difflib import SequenceMatcher

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
from playwright_stealth import Stealth

# Mapping des codes de forme juridique
FORME_JURIDIQUE = {
    '1000': ('EI', 'OUI'),           # Entrepreneur individuel
    '1100': ('EI', 'OUI'),           # Artisan-commerçant
    '1200': ('EI', 'OUI'),           # Commerçant
    '1300': ('EI', 'OUI'),           # Artisan
    '1400': ('EI', 'OUI'),           # Officier ministériel
    '1500': ('EI', 'OUI'),           # Profession libérale
    '1600': ('EI', 'OUI'),           # Exploitant agricole
    '1700': ('EI', 'OUI'),           # Agent commercial
    '1800': ('EI', 'OUI'),           # Associé-gérant de société
    '1900': ('EI', 'OUI'),           # Autre individuel
    '5499': ('SARL', 'NON'),         # SARL de droit commun
    '5485': ('SARL', 'NON'),         # SARL unipersonnelle
    '5498': ('EURL', 'OUI'),         # EURL
    '5710': ('SAS', 'NON'),          # SAS
    '5720': ('SASU', 'OUI'),         # SASU
    '5599': ('SA', 'NON'),           # SA à conseil d'administration
    '6220': ('GIE', 'NON'),          # GIE
}


def normalize_name(name: str) -> str:
    """Normalise un nom pour comparaison."""
    if not name:
        return ''
    name = name.lower()
    name = re.sub(r'[^a-z0-9\s]', '', name)
    name = ' '.join(name.split())
    # Supprimer les mots génériques
    for word in ['sarl', 'sas', 'sasu', 'eurl', 'eirl', 'ei', 'ets', 'etablissements']:
        name = re.sub(rf'\b{word}\b', '', name)
    return name.strip()


def similarity(a: str, b: str) -> float:
    """Calcule la similarité entre deux chaînes."""
    return SequenceMatcher(None, a, b).ratio()


def get_dept_code(dept: str, name: str = '', address: str = '') -> str:
    """Retourne le code département."""
    if dept in ['971', '972', '973', '974']:
        return dept
    # Essayer d'extraire du code postal
    if dept and len(dept) >= 3:
        return dept[:3]

    # Inférer du nom ou de l'adresse
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


class SirenEnricher:
    def __init__(self):
        self.stats = {
            'processed': 0,
            'found': 0,
            'not_found': 0,
            'error': 0,
        }

    def search_entreprise(self, page, name: str, dept: str) -> dict | None:
        """Recherche une entreprise sur annuaire-entreprises."""
        try:
            # Construire l'URL de recherche
            import urllib.parse
            query = f"{name}"
            encoded = urllib.parse.quote(query)

            # Recherche par nom et département
            url = f"https://annuaire-entreprises.data.gouv.fr/rechercher?terme={encoded}&departement={dept}"

            page.goto(url, wait_until='domcontentloaded', timeout=30000)
            time.sleep(random.uniform(2, 4))

            # Chercher les résultats
            results = page.locator('a[href^="/entreprise/"]')
            count = results.count()

            if count == 0:
                return None

            # Prendre le premier résultat qui matche bien
            for i in range(min(count, 5)):
                try:
                    result = results.nth(i)
                    result_name = result.locator('h3, h2, strong').first.text_content() or ''

                    # Vérifier la similarité
                    if similarity(normalize_name(name), normalize_name(result_name)) > 0.6:
                        # Cliquer pour aller sur la fiche
                        href = result.get_attribute('href')
                        if href:
                            page.goto(f"https://annuaire-entreprises.data.gouv.fr{href}",
                                     wait_until='domcontentloaded', timeout=30000)
                            time.sleep(random.uniform(1.5, 3))
                            return self.extract_entreprise_data(page)
                except Exception:
                    continue

            return None

        except PlaywrightTimeout:
            return None
        except Exception as e:
            print(f"    Erreur recherche: {str(e)[:50]}")
            return None

    def extract_entreprise_data(self, page) -> dict | None:
        """Extrait les données d'une fiche entreprise."""
        try:
            data = {
                'siren': '',
                'siret': '',
                'forme_juridique_code': '',
                'forme_juridique': '',
                'individuel': '',
            }

            # SIREN - dans le titre ou les données structurées
            try:
                # Chercher dans le contenu de la page
                content = page.content()

                # SIREN dans l'URL ou le contenu
                siren_match = re.search(r'/entreprise/[^/]*-(\d{9})', page.url)
                if siren_match:
                    data['siren'] = siren_match.group(1)

                # SIRET
                siret_match = re.search(r'SIRET[:\s]+(\d{14})', content)
                if siret_match:
                    data['siret'] = siret_match.group(1)
                    if not data['siren']:
                        data['siren'] = siret_match.group(1)[:9]

                # Forme juridique - chercher dans les données affichées
                fj_patterns = [
                    r'Forme juridique[:\s]+([A-Z][A-Za-z\s\-]+)',
                    r'Nature juridique[:\s]+([A-Z][A-Za-z\s\-]+)',
                    r'>(\d{4})\s*-\s*([^<]+)</span>',  # Code - Libellé
                ]

                for pattern in fj_patterns:
                    match = re.search(pattern, content)
                    if match:
                        if match.lastindex == 2:
                            # Code + libellé
                            code = match.group(1)
                            data['forme_juridique_code'] = code
                            if code in FORME_JURIDIQUE:
                                data['forme_juridique'] = code
                                data['individuel'] = FORME_JURIDIQUE[code][1]
                            else:
                                # Deviner d'après le code
                                if code.startswith('1'):
                                    data['individuel'] = 'OUI'
                                else:
                                    data['individuel'] = 'NON'
                        else:
                            libelle = match.group(1).strip()
                            if 'individu' in libelle.lower() or 'personne physique' in libelle.lower():
                                data['individuel'] = 'OUI'
                            else:
                                data['individuel'] = 'NON'
                        break

            except Exception:
                pass

            if data['siren']:
                return data
            return None

        except Exception:
            return None

    def enrich_file(self, input_file: Path, output_file: Path):
        """Enrichit un fichier CSV avec les SIREN manquants."""

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

        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                args=['--disable-blink-features=AutomationControlled']
            )
            context = browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                locale='fr-FR',
            )
            page = context.new_page()

            stealth = Stealth()
            stealth.apply_stealth_sync(page)

            for idx, (i, row) in enumerate(to_enrich):
                name = row.get('raison_sociale', '')
                address = row.get('adresse', '')
                dept = get_dept_code(
                    row.get('departement', '') or row.get('code_postal', ''),
                    name,
                    address
                )

                print(f"[{idx+1}/{len(to_enrich)}] {name[:50]}... (dept {dept or '?'})")

                self.stats['processed'] += 1

                # Si pas de département, essayer tous les DOM
                if dept:
                    result = self.search_entreprise(page, name, dept)
                else:
                    result = None
                    for try_dept in ['974', '971', '972', '973']:  # Réunion first (most entries)
                        result = self.search_entreprise(page, name, try_dept)
                        if result:
                            break
                        time.sleep(random.uniform(2, 4))

                if result and result.get('siren'):
                    data[i]['siren'] = result['siren']
                    if result.get('siret'):
                        data[i]['siret'] = result['siret']
                    if result.get('forme_juridique'):
                        data[i]['forme_juridique'] = result['forme_juridique']
                    if result.get('individuel'):
                        data[i]['individuel'] = result['individuel']

                    self.stats['found'] += 1
                    print(f"    -> TROUVÉ: {result['siren']} ({result.get('individuel', '?')})")
                else:
                    self.stats['not_found'] += 1
                    print(f"    -> Non trouvé")

                # Pause entre les recherches
                time.sleep(random.uniform(3, 6))

                # Sauvegarder régulièrement
                if (idx + 1) % 20 == 0:
                    self._save(data, fieldnames, output_file)
                    print(f"\n  [Sauvegarde intermédiaire: {self.stats}]\n")

            browser.close()

        # Sauvegarder final
        self._save(data, fieldnames, output_file)

        print("\n=== RÉSULTATS ===")
        print(f"Traités: {self.stats['processed']}")
        print(f"Trouvés: {self.stats['found']}")
        print(f"Non trouvés: {self.stats['not_found']}")
        print(f"Fichier: {output_file}")

    def _save(self, data: list, fieldnames: list, output_file: Path):
        """Sauvegarde les données."""
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data)


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Enrichir les entrées sans SIREN')
    parser.add_argument('--input', '-i', default='processed/plombiers_final.csv',
                       help='Fichier CSV à enrichir')
    parser.add_argument('--output', '-o', default='processed/plombiers_enriched_siren.csv',
                       help='Fichier de sortie')
    parser.add_argument('--limit', '-l', type=int, default=0,
                       help='Limiter le nombre d\'entrées à traiter')
    args = parser.parse_args()

    base_dir = Path(__file__).parent.parent
    input_file = base_dir / args.input
    output_file = base_dir / args.output

    enricher = SirenEnricher()
    enricher.enrich_file(input_file, output_file)


if __name__ == '__main__':
    main()
