#!/usr/bin/env python3
"""
Scrape plumber websites to extract emails and additional phone numbers.
"""

import csv
import re
import time
import random
import requests
from pathlib import Path
from urllib.parse import urlparse

# Common email patterns to look for
EMAIL_PATTERN = re.compile(
    r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
    re.IGNORECASE
)

# Phone patterns (French)
PHONE_PATTERN = re.compile(
    r'(?:\+33|0033|0)\s*[1-9](?:[\s.-]*\d{2}){4}|'
    r'(?:\+590|0590|0690)[\s.-]*\d{2}[\s.-]*\d{2}[\s.-]*\d{2}[\s.-]*\d{2}|'
    r'(?:\+596|0596|0696)[\s.-]*\d{2}[\s.-]*\d{2}[\s.-]*\d{2}[\s.-]*\d{2}|'
    r'(?:\+594|0594|0694)[\s.-]*\d{2}[\s.-]*\d{2}[\s.-]*\d{2}[\s.-]*\d{2}|'
    r'(?:\+262|0262|0692|0693)[\s.-]*\d{2}[\s.-]*\d{2}[\s.-]*\d{2}[\s.-]*\d{2}',
    re.IGNORECASE
)

# Emails to exclude (generic/spam)
EXCLUDED_EMAILS = {
    'example@example.com', 'test@test.com', 'email@example.com',
    'votre@email.com', 'contact@example.com', 'info@example.com',
}

EXCLUDED_DOMAINS = {
    'sentry.io', 'facebook.com', 'google.com', 'twitter.com',
    'instagram.com', 'youtube.com', 'linkedin.com', 'wix.com',
    'wordpress.com', 'squarespace.com', 'shopify.com',
}


def clean_url(url: str) -> str:
    """Ensure URL has proper scheme."""
    if not url:
        return ''
    url = url.strip()
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    return url


def is_valid_email(email: str) -> bool:
    """Check if email is valid and not excluded."""
    email = email.lower()
    if email in EXCLUDED_EMAILS:
        return False
    domain = email.split('@')[-1]
    if domain in EXCLUDED_DOMAINS:
        return False
    # Exclude image extensions in email (false positives)
    if any(ext in email for ext in ['.png', '.jpg', '.gif', '.svg', '.webp']):
        return False
    return True


def normalize_phone(phone: str) -> str:
    """Normalize phone number."""
    return re.sub(r'[\s.-]', '', phone)


def scrape_website(url: str) -> dict:
    """Scrape a website for contact info."""
    result = {
        'emails': [],
        'phones': [],
        'error': None,
    }

    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        }

        response = requests.get(url, headers=headers, timeout=15, allow_redirects=True)
        response.raise_for_status()

        content = response.text

        # Extract emails
        emails = EMAIL_PATTERN.findall(content)
        valid_emails = [e for e in set(emails) if is_valid_email(e)]
        result['emails'] = valid_emails[:3]  # Max 3 emails

        # Extract phones
        phones = PHONE_PATTERN.findall(content)
        normalized = [normalize_phone(p) for p in phones]
        result['phones'] = list(set(normalized))[:3]  # Max 3 phones

        # Also try common contact pages
        if not result['emails']:
            for path in ['/contact', '/nous-contacter', '/contactez-nous']:
                try:
                    contact_url = url.rstrip('/') + path
                    resp = requests.get(contact_url, headers=headers, timeout=10)
                    if resp.status_code == 200:
                        emails = EMAIL_PATTERN.findall(resp.text)
                        valid_emails = [e for e in set(emails) if is_valid_email(e)]
                        result['emails'].extend(valid_emails)
                        result['emails'] = list(set(result['emails']))[:3]
                        if result['emails']:
                            break
                except:
                    pass

    except requests.exceptions.Timeout:
        result['error'] = 'timeout'
    except requests.exceptions.SSLError:
        result['error'] = 'ssl_error'
    except requests.exceptions.ConnectionError:
        result['error'] = 'connection_error'
    except requests.exceptions.HTTPError as e:
        result['error'] = f'http_{e.response.status_code}'
    except Exception as e:
        result['error'] = str(e)[:50]

    return result


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Scrape websites for contact info')
    parser.add_argument('--input', '-i', default='processed/plombiers_final.csv')
    parser.add_argument('--output', '-o', default='processed/plombiers_with_emails.csv')
    parser.add_argument('--limit', '-l', type=int, default=0, help='Limit number of sites to scrape')
    args = parser.parse_args()

    base_dir = Path(__file__).parent.parent
    input_file = base_dir / args.input
    output_file = base_dir / args.output

    # Load data
    with open(input_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        data = list(reader)
        fieldnames = reader.fieldnames

    # Find entries with websites
    to_scrape = [
        (i, row) for i, row in enumerate(data)
        if row.get('site_web') and not row.get('email')
    ]

    if args.limit:
        to_scrape = to_scrape[:args.limit]

    print(f"Total: {len(data)} entrées")
    print(f"À scraper: {len(to_scrape)} sites web")
    print()

    stats = {
        'scraped': 0,
        'emails_found': 0,
        'phones_found': 0,
        'errors': 0,
    }

    for idx, (i, row) in enumerate(to_scrape):
        url = clean_url(row.get('site_web', ''))
        name = row.get('raison_sociale', '')[:40]

        print(f"[{idx+1}/{len(to_scrape)}] {name}...")
        print(f"    URL: {url}")

        result = scrape_website(url)
        stats['scraped'] += 1

        if result['error']:
            print(f"    ❌ Erreur: {result['error']}")
            stats['errors'] += 1
        else:
            if result['emails']:
                data[i]['email'] = result['emails'][0]
                stats['emails_found'] += 1
                print(f"    ✅ Email: {result['emails'][0]}")

            # Add phone if we found one and entry doesn't have one
            if result['phones'] and not row.get('telephone'):
                data[i]['telephone'] = result['phones'][0]
                stats['phones_found'] += 1
                print(f"    ✅ Tél: {result['phones'][0]}")

            if not result['emails'] and not result['phones']:
                print(f"    ⚠️ Aucun contact trouvé")

        # Pause between requests
        time.sleep(random.uniform(1, 2))

        # Save periodically
        if (idx + 1) % 20 == 0:
            with open(output_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(data)
            print(f"\n  [Sauvegarde: {stats}]\n")

    # Final save
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)

    print("\n=== RÉSULTATS ===")
    print(f"Sites scrapés: {stats['scraped']}")
    print(f"Emails trouvés: {stats['emails_found']}")
    print(f"Téléphones trouvés: {stats['phones_found']}")
    print(f"Erreurs: {stats['errors']}")
    print(f"Fichier: {output_file}")


if __name__ == '__main__':
    main()
