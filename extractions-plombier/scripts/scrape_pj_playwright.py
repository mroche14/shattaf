#!/usr/bin/env python3
"""
Scraper Pages Jaunes avec Playwright pour enrichir les données plombiers DOM.

Ce script utilise Playwright pour automatiser un navigateur et contourner
les protections anti-bot de Pages Jaunes.

Usage:
    python scrape_pj_playwright.py
    python scrape_pj_playwright.py --departement 971
    python scrape_pj_playwright.py --max-pages 3
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

from playwright.sync_api import sync_playwright, Page, Browser
from playwright_stealth import Stealth

# Départements DOM et leurs noms pour la recherche Pages Jaunes
DEPARTEMENTS = {
    '971': 'guadeloupe',
    '972': 'martinique',
    '973': 'guyane',
    '974': 'reunion',  # Note: sans "la-" pour Pages Jaunes
}

# Colonnes du CSV de sortie - EXHAUSTIF
OUTPUT_COLUMNS = [
    'nom',
    'activites',           # Catégories d'activité
    'adresse',
    'code_postal',
    'ville',
    'departement',
    'telephone_1',
    'telephone_2',
    'has_email_form',      # Formulaire email dispo (oui/non)
    'site_web',
    'horaires',
    'moyens_paiement',     # CB, Espèces, Virement...
    'prestations',         # Services proposés
    'produits',            # Produits vendus
    'zone_intervention',   # Zone géographique
    'description',         # Texte de présentation
    'siren',
    'siret',
    'code_naf',
    'date_creation',
    'effectif',
    'type_etablissement',  # Siège, Secondaire...
    'note_pj',
    'nb_avis_pj',
    'url_pagesjaunes',
    'date_extraction',
]


class PagesJaunesPlaywrightScraper:
    """Scraper Pages Jaunes avec Playwright."""

    def __init__(self, headless: bool = True, delay_min: float = 2.0, delay_max: float = 4.0):
        self.headless = headless
        self.delay_min = delay_min
        self.delay_max = delay_max
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None

    def _wait(self):
        """Attend un délai aléatoire."""
        delay = random.uniform(self.delay_min, self.delay_max)
        time.sleep(delay)

    def start(self, playwright):
        """Démarre le navigateur."""
        self.browser = playwright.chromium.launch(headless=self.headless)
        context = self.browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale='fr-FR',
        )
        # Apply stealth to avoid bot detection
        stealth = Stealth(
            navigator_languages_override=('fr-FR', 'fr'),
            navigator_platform_override='Linux x86_64',
        )
        stealth.apply_stealth_sync(context)
        self.page = context.new_page()

    def stop(self):
        """Arrête le navigateur."""
        if self.browser:
            self.browser.close()

    def _handle_cookies(self):
        """Gère la popup de consentement cookies (AppConsent)."""
        try:
            # Méthode 1: Chercher dans l'iframe AppConsent
            frames = self.page.frames
            for frame in frames:
                try:
                    # Chercher bouton dans chaque frame
                    for text in ['Tout refuser', 'Continuer sans accepter', 'Refuser', 'Tout accepter', 'Accepter']:
                        btn = frame.query_selector(f'button:has-text("{text}")')
                        if btn and btn.is_visible():
                            btn.click()
                            time.sleep(1)
                            return True
                except:
                    continue

            # Méthode 2: Chercher dans la page principale
            cookie_selectors = [
                'button:has-text("Tout refuser")',
                'button:has-text("Refuser")',
                'button:has-text("Continuer sans accepter")',
                'button:has-text("Tout accepter")',
                'button:has-text("Accepter")',
                '#appconsent button',
                '[id*="didomi"] button',
                '[class*="cookie"] button',
            ]
            for selector in cookie_selectors:
                try:
                    btn = self.page.query_selector(selector)
                    if btn and btn.is_visible():
                        btn.click()
                        time.sleep(1)
                        return True
                except:
                    continue

            # Méthode 3: Masquer l'overlay avec JavaScript
            try:
                self.page.evaluate('''
                    const overlay = document.getElementById("appconsent");
                    if (overlay) overlay.style.display = "none";

                    // Masquer tous les iframes de consentement
                    document.querySelectorAll('iframe[title*="consentement"], iframe[title*="consent"]').forEach(f => {
                        f.style.display = "none";
                    });
                ''')
                time.sleep(0.5)
                return True
            except:
                pass

        except Exception:
            pass
        return False

    def _extract_phones_from_page(self) -> List[str]:
        """Extrait les téléphones visibles sur la page."""
        phones = []
        # Chercher les numéros dans le texte
        text = self.page.content()
        phone_matches = re.findall(r'(?:Tél\s*:\s*)?0[1-9](?:[\s.]?\d{2}){4}', text)
        for match in phone_matches:
            phone = re.sub(r'[^\d]', '', match)
            if len(phone) == 10 and phone not in phones:
                phones.append(phone)
        return phones

    def _parse_search_results(self) -> List[Dict]:
        """Parse les résultats de recherche sur la page actuelle."""
        results = []

        # Attendre que les résultats soient chargés
        try:
            self.page.wait_for_selector('li[class*="bi-"]', timeout=10000)
        except:
            print("  Pas de résultats trouvés")
            return results

        # Récupérer tous les items
        items = self.page.query_selector_all('li[class*="bi-"]')

        for item in items:
            try:
                result = {col: None for col in OUTPUT_COLUMNS}
                result['date_extraction'] = datetime.now().strftime('%Y-%m-%d')

                # Nom
                name_elem = item.query_selector('h3 a, h3')
                if name_elem:
                    result['nom'] = name_elem.inner_text().strip()

                # URL
                link_elem = item.query_selector('a[href*="/pros/"]')
                if link_elem:
                    href = link_elem.get_attribute('href')
                    if href:
                        if href.startswith('/'):
                            result['url_pagesjaunes'] = f"https://www.pagesjaunes.fr{href}"
                        else:
                            result['url_pagesjaunes'] = href

                # Adresse
                addr_elem = item.query_selector('a[href*="Voir le plan"]')
                if addr_elem:
                    addr_text = addr_elem.inner_text().strip()
                    addr_text = re.sub(r'\s*Voir le plan.*$', '', addr_text).strip()
                    result['adresse'] = addr_text

                    # Extraire code postal et ville
                    cp_match = re.search(r'(97\d{3})\s+(.+)$', addr_text)
                    if cp_match:
                        result['code_postal'] = cp_match.group(1)
                        result['ville'] = cp_match.group(2).strip()
                        result['departement'] = cp_match.group(1)[:3]

                # Note
                note_elem = item.query_selector('[title*="Note"], [class*="note"]')
                if note_elem:
                    note_text = note_elem.inner_text().strip()
                    note_match = re.search(r'(\d+(?:[.,]\d+)?)', note_text)
                    if note_match:
                        result['note_pj'] = note_match.group(1).replace(',', '.')

                # Nombre d'avis
                avis_elem = item.query_selector('a[href*="avis"]')
                if avis_elem:
                    avis_text = avis_elem.inner_text().strip()
                    avis_match = re.search(r'(\d+)\s*avis', avis_text)
                    if avis_match:
                        result['nb_avis_pj'] = avis_match.group(1)

                if result['nom']:
                    results.append(result)

            except Exception as e:
                print(f"  Erreur parsing item: {e}")
                continue

        return results

    def _click_show_phone(self, item_selector: str) -> List[str]:
        """Clique sur 'Afficher le numéro' et récupère les téléphones."""
        phones = []
        try:
            btn = self.page.query_selector(f'{item_selector} button:has-text("Afficher")')
            if btn:
                btn.click()
                time.sleep(1)  # Attendre le chargement

                # Récupérer les numéros affichés
                phone_elems = self.page.query_selector_all(f'{item_selector} [class*="tel"]')
                for elem in phone_elems:
                    text = elem.inner_text()
                    phone_match = re.search(r'0[1-9](?:[\s.]?\d{2}){4}', text)
                    if phone_match:
                        phone = re.sub(r'[^\d]', '', phone_match.group())
                        if phone not in phones:
                            phones.append(phone)
        except Exception as e:
            pass
        return phones

    def _enrich_from_detail_page(self, url: str) -> Dict:
        """Enrichit les données depuis la page de détail - EXTRACTION EXHAUSTIVE."""
        enriched = {}
        try:
            self.page.goto(url, wait_until='domcontentloaded', timeout=15000)
            time.sleep(1.5)
            self._handle_cookies()

            # 1. TÉLÉPHONES - Cliquer sur tous les boutons pour révéler les numéros
            phones = []
            try:
                # Cliquer sur boutons "Afficher le n°"
                phone_buttons = self.page.query_selector_all('link:has-text("Afficher le n"), button:has-text("Afficher")')
                for btn in phone_buttons[:5]:
                    try:
                        if btn.is_visible():
                            btn.click()
                            time.sleep(0.5)
                    except:
                        pass

                time.sleep(0.5)

                # Chercher les numéros affichés dans le contenu
                content = self.page.content()
                # Pattern pour numéros FR: 0X XX XX XX XX ou 0X.XX.XX.XX.XX
                phone_matches = re.findall(r'(?<!\d)0[1-9](?:[\s\.]?\d{2}){4}(?!\d)', content)
                for match in phone_matches:
                    phone = re.sub(r'[^\d]', '', match)
                    if len(phone) == 10 and phone not in phones:
                        phones.append(phone)

            except Exception:
                pass

            if len(phones) >= 1:
                enriched['telephone_1'] = phones[0]
            if len(phones) >= 2:
                enriched['telephone_2'] = phones[1]

            # 2. FORMULAIRE EMAIL - Vérifier si bouton email existe
            try:
                email_btn = self.page.query_selector('a:has-text("Email"), link:has-text("Email")')
                if email_btn and email_btn.is_visible():
                    enriched['has_email_form'] = 'oui'
                else:
                    enriched['has_email_form'] = 'non'
            except:
                enriched['has_email_form'] = 'non'

            # 3. ADRESSE COMPLÈTE - Depuis le lien "Localisation"
            try:
                addr_link = self.page.query_selector('a:has-text("Localisation"), link:has-text("Localisation")')
                if addr_link:
                    addr_text = addr_link.inner_text()
                    addr_text = re.sub(r'^\s*Localisation\s*', '', addr_text).strip()
                    addr_text = re.sub(r'\s+', ' ', addr_text)
                    if addr_text and len(addr_text) > 5:
                        enriched['adresse'] = addr_text
                        # Extraire code postal et ville
                        cp_match = re.search(r'(97\d{3})\s+(.+?)$', addr_text)
                        if cp_match:
                            enriched['code_postal'] = cp_match.group(1)
                            enriched['ville'] = cp_match.group(2).strip()
                            enriched['departement'] = cp_match.group(1)[:3]
            except:
                pass

            # 4. ACTIVITÉS/CATÉGORIES
            try:
                activites = []
                # Chercher dans la zone d'activité en haut de page
                act_elems = self.page.query_selector_all('generic:has-text("plombier"), generic:has-text("Dépannage"), a[href*="activites"]')
                for elem in act_elems[:5]:
                    try:
                        text = elem.inner_text().strip()
                        if text and len(text) < 50 and text not in activites:
                            activites.append(text)
                    except:
                        pass
                # Chercher section "Activités"
                act_section = self.page.query_selector('h2:has-text("Activités")')
                if act_section:
                    parent = act_section.evaluate_handle('node => node.parentElement')
                    if parent:
                        items = parent.query_selector_all('li')
                        for item in items[:10]:
                            text = item.inner_text().strip()
                            if text and text not in activites:
                                activites.append(text)
                if activites:
                    enriched['activites'] = ' | '.join(activites[:5])
            except:
                pass

            # 5. HORAIRES - Extraction depuis le tableau
            try:
                horaires_parts = []
                # Chercher le tableau des horaires
                rows = self.page.query_selector_all('table tr, [class*="horaire"] tr')
                for row in rows:
                    try:
                        cells = row.query_selector_all('th, td')
                        if len(cells) >= 2:
                            jour = cells[0].inner_text().strip().replace('•', '').strip()
                            heures = cells[1].inner_text().strip()
                            if jour and heures:
                                horaires_parts.append(f"{jour}: {heures}")
                    except:
                        pass
                if horaires_parts:
                    enriched['horaires'] = ' | '.join(horaires_parts)
            except:
                pass

            # 6. MOYENS DE PAIEMENT
            try:
                paiements = []
                # Chercher les icônes/images de paiement
                pay_imgs = self.page.query_selector_all('img[alt*="Espèces"], img[alt*="CB"], img[alt*="Visa"], img[alt*="Mastercard"], img[alt*="Virement"], img[alt*="Chèque"]')
                for img in pay_imgs:
                    alt = img.get_attribute('alt')
                    if alt and alt not in paiements:
                        paiements.append(alt)
                if paiements:
                    enriched['moyens_paiement'] = ', '.join(paiements)
            except:
                pass

            # 7. PRESTATIONS/SERVICES
            try:
                prestations = []
                # Chercher section "Prestations"
                prest_heading = self.page.query_selector('h2:has-text("Prestations")')
                if prest_heading:
                    # Chercher la liste après le heading
                    prest_list = self.page.query_selector('h2:has-text("Prestations") + ul, h2:has-text("Prestations") ~ ul')
                    if prest_list:
                        items = prest_list.query_selector_all('li')
                        for item in items[:15]:
                            text = item.inner_text().strip()
                            if text:
                                prestations.append(text)
                if prestations:
                    enriched['prestations'] = ' | '.join(prestations)
            except:
                pass

            # 8. PRODUITS
            try:
                produits = []
                prod_heading = self.page.query_selector('h2:has-text("Produits")')
                if prod_heading:
                    prod_list = self.page.query_selector('h2:has-text("Produits") + ul, h2:has-text("Produits") ~ ul')
                    if prod_list:
                        items = prod_list.query_selector_all('li')
                        for item in items[:10]:
                            text = item.inner_text().strip()
                            if text:
                                produits.append(text)
                if produits:
                    enriched['produits'] = ' | '.join(produits)
            except:
                pass

            # 9. ZONE D'INTERVENTION
            try:
                zone_heading = self.page.query_selector('h4:has-text("Zone d\'intervention"), h3:has-text("Zone d\'intervention")')
                if zone_heading:
                    # Trouver le texte suivant
                    zone_list = self.page.query_selector('h4:has-text("Zone d\'intervention") ~ ul, h4:has-text("Zone d\'intervention") + ul')
                    if zone_list:
                        zones = []
                        items = zone_list.query_selector_all('li')
                        for item in items[:5]:
                            text = item.inner_text().strip()
                            if text:
                                zones.append(text)
                        if zones:
                            enriched['zone_intervention'] = ', '.join(zones)
            except:
                pass

            # 10. DESCRIPTION - Texte de présentation
            try:
                # Chercher le paragraphe après "Plus d'infos sur"
                content = self.page.content()
                # Pattern pour extraire la description
                desc_match = re.search(r'Plus d\'infos sur[^:]+:\s*</p>\s*<p[^>]*>([^<]+(?:<br[^>]*>[^<]+)*)', content, re.DOTALL)
                if desc_match:
                    desc_text = desc_match.group(1)
                    desc_text = re.sub(r'<[^>]+>', ' ', desc_text)
                    desc_text = re.sub(r'\s+', ' ', desc_text).strip()
                    if len(desc_text) > 20 and len(desc_text) < 1000 and 'ces résultats' not in desc_text:
                        enriched['description'] = desc_text
            except:
                pass

            # 11. NOTE ET AVIS
            try:
                # Note moyenne
                note_elem = self.page.query_selector('[class*="note"] strong, generic:has-text("/5")')
                if note_elem:
                    note_text = note_elem.inner_text()
                    note_match = re.search(r'(\d+(?:[.,]\d+)?)', note_text)
                    if note_match:
                        enriched['note_pj'] = note_match.group(1).replace(',', '.')

                # Nombre d'avis
                avis_elem = self.page.query_selector('generic:has-text("avis sur")')
                if avis_elem:
                    avis_text = avis_elem.inner_text()
                    avis_match = re.search(r'(\d+)\s*avis', avis_text)
                    if avis_match:
                        enriched['nb_avis_pj'] = avis_match.group(1)
            except:
                pass

            # 12. INFOS LÉGALES - Cliquer pour ouvrir puis extraire
            try:
                # Masquer popup cookies si présent
                self._handle_cookies()

                # Scroll vers le bas pour s'assurer que le bouton est visible
                self.page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
                time.sleep(0.5)

                legal_btn = self.page.query_selector('button:has-text("Ouvrir les annonces")')
                if legal_btn:
                    # Scroll vers l'élément et cliquer via JavaScript si nécessaire
                    try:
                        legal_btn.scroll_into_view_if_needed()
                        time.sleep(0.3)
                        legal_btn.click(timeout=5000)
                    except:
                        # Fallback: clic via JavaScript
                        self.page.evaluate('document.querySelector(\'button[class*="annonces"]\')?.click()')
                    time.sleep(1.5)

                content = self.page.content()

                # SIRET (14 chiffres) - format avec whitespace: <strong>\n  39312687500011\n  </strong>
                siret_match = re.search(r'SIRET.*?<strong[^>]*>\s*(\d{14})\s*</strong>', content, re.DOTALL | re.IGNORECASE)
                if not siret_match:
                    # Fallback: chercher juste 14 chiffres après SIRET
                    siret_match = re.search(r'SIRET[^\d]{0,100}(\d{14})', content, re.IGNORECASE)
                if siret_match:
                    enriched['siret'] = siret_match.group(1)
                    enriched['siren'] = siret_match.group(1)[:9]

                # SIREN seul (9 chiffres) - si pas de SIRET
                if 'siren' not in enriched:
                    siren_match = re.search(r'SIREN.*?<strong[^>]*>\s*(\d{9})\s*</strong>', content, re.DOTALL | re.IGNORECASE)
                    if not siren_match:
                        siren_match = re.search(r'SIREN[^\d]{0,100}(\d{9})(?!\d)', content, re.IGNORECASE)
                    if siren_match:
                        enriched['siren'] = siren_match.group(1)

                # Code NAF - format avec whitespace: <strong>\n  4322A\n  </strong>
                naf_match = re.search(r'Code NAF.*?<strong[^>]*>\s*(\d{4}[A-Z])\s*</strong>', content, re.DOTALL | re.IGNORECASE)
                if not naf_match:
                    naf_match = re.search(r'NAF[^\d]{0,50}(\d{2}\.?\d{2}[A-Z])', content, re.IGNORECASE)
                if naf_match:
                    enriched['code_naf'] = naf_match.group(1).replace('.', '')

                # Date de création - format "22 novembre 1993"
                date_match = re.search(r">Création d'entreprise</.*?<strong[^>]*>([^<]+)</strong>", content, re.DOTALL | re.IGNORECASE)
                if date_match:
                    enriched['date_creation'] = date_match.group(1).strip()

                # Effectif - format: "0 salarié"
                effectif_match = re.search(r">Effectif de l'(?:établissement|entreprise)</.*?<strong[^>]*>([^<]+)</strong>", content, re.DOTALL | re.IGNORECASE)
                if effectif_match:
                    enriched['effectif'] = effectif_match.group(1).strip()

                # Type établissement (Siège, Secondaire...)
                type_match = re.search(r">Typologie de l'établissement</.*?<strong[^>]*>([^<]+)</strong>", content, re.DOTALL | re.IGNORECASE)
                if type_match:
                    enriched['type_etablissement'] = type_match.group(1).strip()

            except Exception as e:
                pass

            # 13. SITE WEB
            try:
                site_link = self.page.query_selector('a:has-text("Site web"), a[class*="website"]')
                if site_link:
                    href = site_link.get_attribute('href')
                    if href and 'pagesjaunes' not in href and href.startswith('http'):
                        enriched['site_web'] = href
            except:
                pass

        except Exception as e:
            print(f"  Erreur enrichissement: {e}")

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

        all_results = []
        page_num = 1

        while page_num <= max_pages:
            if page_num == 1:
                url = f"https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=plombier&ou={dept_name}"
            else:
                url = f"https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=plombier&ou={dept_name}&page={page_num}"

            print(f"\nPage {page_num}: {url}")

            try:
                self.page.goto(url, wait_until='domcontentloaded', timeout=30000)
                time.sleep(1)

                # Gérer cookies à la première page
                if page_num == 1:
                    self._handle_cookies()
                    time.sleep(0.5)

                # Vérifier le nombre de résultats
                nb_results_elem = self.page.query_selector('p:has-text("résultat")')
                if nb_results_elem and page_num == 1:
                    nb_text = nb_results_elem.inner_text()
                    print(f"  {nb_text}")

                # Parser les résultats
                results = self._parse_search_results()
                print(f"  {len(results)} professionnels trouvés")

                if not results:
                    break

                all_results.extend(results)

                # Vérifier pagination
                pagination = self.page.query_selector('[class*="pagination"]')
                if pagination:
                    pag_text = pagination.inner_text()
                    match = re.search(rf'Page\s*{page_num}\s*/\s*(\d+)', pag_text)
                    if match:
                        total_pages = int(match.group(1))
                        if page_num >= total_pages:
                            print("  Dernière page atteinte")
                            break
                else:
                    # Pas de pagination, c'est la dernière page
                    if page_num > 1:
                        break

            except Exception as e:
                print(f"  Erreur: {e}")
                break

            page_num += 1

        print(f"\nTotal: {len(all_results)} professionnels trouvés")

        # Enrichissement
        if enrich and all_results:
            print(f"\nEnrichissement des fiches...")
            for i, result in enumerate(all_results):
                if result.get('url_pagesjaunes'):
                    print(f"  [{i+1}/{len(all_results)}] {result['nom']}")
                    enriched = self._enrich_from_detail_page(result['url_pagesjaunes'])
                    result.update({k: v for k, v in enriched.items() if v})

        return all_results

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
    parser = argparse.ArgumentParser(description='Scrape Pages Jaunes avec Playwright')
    parser.add_argument('--departement', '-d', help='Code département (971-974)')
    parser.add_argument('--max-pages', '-p', type=int, default=20, help='Nombre max de pages')
    parser.add_argument('--no-enrich', action='store_true', help='Ne pas enrichir avec pages de détail')
    parser.add_argument('--output', '-o', help='Fichier de sortie')
    parser.add_argument('--headed', action='store_true', help='Mode avec affichage navigateur')
    args = parser.parse_args()

    base_dir = Path(__file__).parent.parent
    raw_dir = base_dir / 'raw'

    with sync_playwright() as playwright:
        scraper = PagesJaunesPlaywrightScraper(headless=not args.headed)
        scraper.start(playwright)

        try:
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

            output_path = raw_dir / (args.output or default_output)
            save_results(results, output_path)

            # Stats détaillées
            print(f"\n{'='*60}")
            print("STATISTIQUES")
            print(f"{'='*60}")
            print(f"Total: {len(results)}")

            with_phone = sum(1 for r in results if r.get('telephone_1'))
            print(f"Avec téléphone: {with_phone} ({100*with_phone//max(len(results),1)}%)")

            with_addr = sum(1 for r in results if r.get('adresse'))
            print(f"Avec adresse: {with_addr} ({100*with_addr//max(len(results),1)}%)")

            with_horaires = sum(1 for r in results if r.get('horaires'))
            print(f"Avec horaires: {with_horaires} ({100*with_horaires//max(len(results),1)}%)")

            with_siren = sum(1 for r in results if r.get('siren'))
            print(f"Avec SIREN: {with_siren} ({100*with_siren//max(len(results),1)}%)")

            with_email = sum(1 for r in results if r.get('has_email_form') == 'oui')
            print(f"Avec formulaire email: {with_email} ({100*with_email//max(len(results),1)}%)")

            with_prestations = sum(1 for r in results if r.get('prestations'))
            print(f"Avec prestations: {with_prestations} ({100*with_prestations//max(len(results),1)}%)")

        finally:
            scraper.stop()


if __name__ == '__main__':
    main()
