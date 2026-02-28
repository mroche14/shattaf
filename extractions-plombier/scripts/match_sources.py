#!/usr/bin/env python3
"""
Script de matching entre sources SIRENE et Pages Jaunes.

Ce script croise les données SIRENE (officielles) avec les données Pages Jaunes
(coordonnées enrichies) pour produire un fichier final avec toutes les infos.

Usage:
    python match_sources.py
    python match_sources.py --sirene raw/sirene_971.csv --pagesjaunes raw/pagesjaunes_971.csv
"""

import argparse
import csv
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from difflib import SequenceMatcher

from utils import normalize_siren, normalize_phone, normalize_email, normalize_raison_sociale


def load_csv(filepath: Path) -> List[Dict]:
    """Charge un fichier CSV."""
    records = []
    try:
        with open(filepath, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                records.append(dict(row))
    except Exception as e:
        print(f"Erreur lecture {filepath}: {e}")
    return records


def similarity(s1: str, s2: str) -> float:
    """Calcule la similarité entre deux chaînes."""
    if not s1 or not s2:
        return 0.0
    return SequenceMatcher(None, s1.lower(), s2.lower()).ratio()


def normalize_for_match(name: str) -> str:
    """Normalise un nom pour le matching."""
    if not name:
        return ""
    # Supprimer ponctuation et caractères spéciaux
    name = re.sub(r'[^\w\s]', ' ', name.upper())
    # Supprimer formes juridiques
    formes = ['SARL', 'EURL', 'SAS', 'SASU', 'SA', 'EI', 'EIRL', 'SCI', 'SELARL', 'ENTREPRISE', 'ETS']
    for forme in formes:
        name = re.sub(rf'\b{forme}\b', '', name)
    # Normaliser espaces
    name = ' '.join(name.split())
    return name.strip()


def extract_city_from_address(address: str) -> Optional[str]:
    """Extrait la ville d'une adresse."""
    if not address:
        return None
    # Chercher code postal + ville
    match = re.search(r'97\d{3}\s+(.+?)(?:\s*$|,)', address)
    if match:
        return match.group(1).strip().upper()
    return None


def match_by_siren(sirene_records: List[Dict], pj_records: List[Dict]) -> Tuple[Dict, List[Dict]]:
    """
    Matche les enregistrements par SIREN.

    Returns:
        Tuple[matched_dict, unmatched_pj_list]
    """
    # Indexer SIRENE par SIREN
    sirene_by_siren = {}
    for rec in sirene_records:
        siren = normalize_siren(rec.get('siren', '') or rec.get('siret', ''))
        if siren:
            sirene_by_siren[siren] = rec

    matched = {}  # siren -> (sirene_rec, pj_rec)
    unmatched_pj = []

    for pj_rec in pj_records:
        pj_siren = normalize_siren(pj_rec.get('siren', '') or pj_rec.get('siret', ''))
        if pj_siren and pj_siren in sirene_by_siren:
            matched[pj_siren] = (sirene_by_siren[pj_siren], pj_rec)
        else:
            unmatched_pj.append(pj_rec)

    return matched, unmatched_pj


def match_by_name_address(sirene_records: List[Dict], pj_records: List[Dict],
                          threshold: float = 0.7) -> Tuple[List[Tuple], List[Dict]]:
    """
    Matche les enregistrements par nom et adresse (fuzzy matching).

    Returns:
        Tuple[matched_pairs, unmatched_pj_list]
    """
    matched_pairs = []
    unmatched_pj = []

    # Créer un index pour accélérer la recherche
    sirene_index = []
    for rec in sirene_records:
        name = normalize_for_match(
            rec.get('denominationUniteLegale', '') or
            rec.get('raison_sociale', '') or
            f"{rec.get('prenom1UniteLegale', '')} {rec.get('nomUniteLegale', '')}"
        )
        city = (rec.get('libelleCommuneEtablissement', '') or
                rec.get('ville', '') or '').upper()
        cp = rec.get('codePostalEtablissement', '') or rec.get('code_postal', '')
        sirene_index.append((name, city, cp, rec))

    for pj_rec in pj_records:
        pj_name = normalize_for_match(pj_rec.get('nom', ''))
        pj_city = (pj_rec.get('ville', '') or '').upper()
        pj_cp = pj_rec.get('code_postal', '')

        if not pj_name:
            unmatched_pj.append(pj_rec)
            continue

        best_match = None
        best_score = 0

        for sirene_name, sirene_city, sirene_cp, sirene_rec in sirene_index:
            # Score de base sur le nom
            name_score = similarity(pj_name, sirene_name)

            # Bonus si même ville ou code postal
            location_bonus = 0
            if pj_cp and sirene_cp and pj_cp == sirene_cp:
                location_bonus = 0.2
            elif pj_city and sirene_city and similarity(pj_city, sirene_city) > 0.8:
                location_bonus = 0.15

            total_score = name_score + location_bonus

            if total_score > best_score:
                best_score = total_score
                best_match = sirene_rec

        if best_score >= threshold and best_match:
            matched_pairs.append((best_match, pj_rec, best_score))
        else:
            unmatched_pj.append(pj_rec)

    return matched_pairs, unmatched_pj


def merge_records(sirene_rec: Dict, pj_rec: Dict) -> Dict:
    """Fusionne un enregistrement SIRENE avec un enregistrement Pages Jaunes."""
    merged = {}

    # Priorité SIRENE pour les infos officielles
    merged['siren'] = normalize_siren(sirene_rec.get('siren', '') or sirene_rec.get('siret', ''))
    merged['siret'] = sirene_rec.get('siret', '')
    merged['raison_sociale'] = (
        sirene_rec.get('denominationUniteLegale') or
        sirene_rec.get('raison_sociale') or
        f"{sirene_rec.get('prenom1UniteLegale', '')} {sirene_rec.get('nomUniteLegale', '')}".strip()
    )
    merged['code_ape'] = (
        sirene_rec.get('activitePrincipaleEtablissement', '').replace('.', '') or
        sirene_rec.get('code_ape', '')
    )
    merged['forme_juridique'] = sirene_rec.get('categorieJuridiqueUniteLegale', '')

    # Adresse - préférer SIRENE mais enrichir avec PJ
    merged['adresse'] = ' '.join(filter(None, [
        sirene_rec.get('numeroVoieEtablissement', ''),
        sirene_rec.get('typeVoieEtablissement', ''),
        sirene_rec.get('libelleVoieEtablissement', '')
    ])) or pj_rec.get('adresse', '')
    merged['code_postal'] = sirene_rec.get('codePostalEtablissement', '') or pj_rec.get('code_postal', '')
    merged['ville'] = sirene_rec.get('libelleCommuneEtablissement', '') or pj_rec.get('ville', '')
    merged['departement'] = merged['code_postal'][:3] if merged['code_postal'] else ''

    # Coordonnées - depuis Pages Jaunes
    merged['telephone'] = normalize_phone(pj_rec.get('telephone_1', ''))
    merged['telephone_2'] = normalize_phone(pj_rec.get('telephone_2', ''))
    merged['site_web'] = pj_rec.get('site_web', '')

    # Dates et autres
    merged['date_creation'] = (
        sirene_rec.get('dateCreationUniteLegale', '') or
        sirene_rec.get('date_creation', '') or
        pj_rec.get('date_creation', '')
    )
    merged['effectif'] = sirene_rec.get('trancheEffectifsEtablissement', '') or pj_rec.get('effectif', '')

    # Avis Pages Jaunes
    merged['note_avis'] = pj_rec.get('note_pj', '')
    merged['nb_avis'] = pj_rec.get('nb_avis_pj', '')

    # Statut
    merged['statut'] = 'ACTIF' if sirene_rec.get('etatAdministratifEtablissement', '') == 'A' else 'INACTIF'

    # Sources
    merged['sources'] = 'sirene|pagesjaunes'

    return merged


def create_from_sirene_only(sirene_rec: Dict) -> Dict:
    """Crée un enregistrement à partir de SIRENE uniquement."""
    return {
        'siren': normalize_siren(sirene_rec.get('siren', '') or sirene_rec.get('siret', '')),
        'siret': sirene_rec.get('siret', ''),
        'raison_sociale': (
            sirene_rec.get('denominationUniteLegale') or
            f"{sirene_rec.get('prenom1UniteLegale', '')} {sirene_rec.get('nomUniteLegale', '')}".strip()
        ),
        'code_ape': sirene_rec.get('activitePrincipaleEtablissement', '').replace('.', ''),
        'forme_juridique': sirene_rec.get('categorieJuridiqueUniteLegale', ''),
        'adresse': ' '.join(filter(None, [
            sirene_rec.get('numeroVoieEtablissement', ''),
            sirene_rec.get('typeVoieEtablissement', ''),
            sirene_rec.get('libelleVoieEtablissement', '')
        ])),
        'code_postal': sirene_rec.get('codePostalEtablissement', ''),
        'ville': sirene_rec.get('libelleCommuneEtablissement', ''),
        'departement': sirene_rec.get('codePostalEtablissement', '')[:3] if sirene_rec.get('codePostalEtablissement') else '',
        'telephone': '',
        'telephone_2': '',
        'site_web': '',
        'date_creation': sirene_rec.get('dateCreationUniteLegale', ''),
        'effectif': sirene_rec.get('trancheEffectifsEtablissement', ''),
        'note_avis': '',
        'nb_avis': '',
        'statut': 'ACTIF' if sirene_rec.get('etatAdministratifEtablissement', '') == 'A' else 'INACTIF',
        'sources': 'sirene',
    }


def main():
    parser = argparse.ArgumentParser(description='Match SIRENE et Pages Jaunes')
    parser.add_argument('--sirene', '-s', nargs='+', help='Fichiers SIRENE CSV')
    parser.add_argument('--pagesjaunes', '-p', nargs='+', help='Fichiers Pages Jaunes CSV')
    parser.add_argument('--output', '-o', default='plombiers_enrichis.csv', help='Fichier de sortie')
    parser.add_argument('--threshold', '-t', type=float, default=0.7, help='Seuil de similarité pour matching par nom')
    args = parser.parse_args()

    base_dir = Path(__file__).parent.parent
    raw_dir = base_dir / 'raw'
    processed_dir = base_dir / 'processed'

    # Charger fichiers SIRENE
    sirene_files = args.sirene or list(raw_dir.glob('sirene_*.csv'))
    sirene_records = []
    for f in sirene_files:
        filepath = Path(f) if Path(f).is_absolute() else raw_dir / f
        records = load_csv(filepath)
        print(f"SIRENE: {filepath.name} -> {len(records)} enregistrements")
        sirene_records.extend(records)

    # Charger fichiers Pages Jaunes
    pj_files = args.pagesjaunes or list(raw_dir.glob('pagesjaunes_*.csv'))
    pj_records = []
    for f in pj_files:
        filepath = Path(f) if Path(f).is_absolute() else raw_dir / f
        if filepath.exists():
            records = load_csv(filepath)
            print(f"Pages Jaunes: {filepath.name} -> {len(records)} enregistrements")
            pj_records.extend(records)

    print(f"\nTotal SIRENE: {len(sirene_records)}")
    print(f"Total Pages Jaunes: {len(pj_records)}")

    final_records = []
    matched_sirene_sirens = set()

    if pj_records:
        # Phase 1: Matching par SIREN
        print("\n--- Matching par SIREN ---")
        siren_matched, unmatched_pj = match_by_siren(sirene_records, pj_records)
        print(f"Matchés par SIREN: {len(siren_matched)}")

        for siren, (sirene_rec, pj_rec) in siren_matched.items():
            merged = merge_records(sirene_rec, pj_rec)
            final_records.append(merged)
            matched_sirene_sirens.add(siren)

        # Phase 2: Matching par nom/adresse pour les non-matchés
        if unmatched_pj:
            print(f"\n--- Matching par nom/adresse ({len(unmatched_pj)} à matcher) ---")
            unmatched_sirene = [r for r in sirene_records
                               if normalize_siren(r.get('siren', '') or r.get('siret', '')) not in matched_sirene_sirens]

            name_matched, still_unmatched = match_by_name_address(
                unmatched_sirene, unmatched_pj, threshold=args.threshold
            )
            print(f"Matchés par nom: {len(name_matched)}")
            print(f"Non matchés PJ: {len(still_unmatched)}")

            for sirene_rec, pj_rec, score in name_matched:
                merged = merge_records(sirene_rec, pj_rec)
                merged['match_score'] = f"{score:.2f}"
                final_records.append(merged)
                siren = normalize_siren(sirene_rec.get('siren', '') or sirene_rec.get('siret', ''))
                if siren:
                    matched_sirene_sirens.add(siren)

    # Ajouter les enregistrements SIRENE non matchés
    print("\n--- Ajout SIRENE non matchés ---")
    for sirene_rec in sirene_records:
        siren = normalize_siren(sirene_rec.get('siren', '') or sirene_rec.get('siret', ''))
        if siren and siren not in matched_sirene_sirens:
            final_records.append(create_from_sirene_only(sirene_rec))

    print(f"Total après ajout SIRENE seuls: {len(final_records)}")

    # Sauvegarder
    output_path = processed_dir / args.output
    output_columns = [
        'siren', 'siret', 'raison_sociale', 'code_ape', 'forme_juridique',
        'adresse', 'code_postal', 'ville', 'departement',
        'telephone', 'telephone_2', 'site_web',
        'date_creation', 'effectif', 'note_avis', 'nb_avis',
        'statut', 'sources'
    ]

    with open(output_path, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=output_columns, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(final_records)

    print(f"\nSauvegardé: {output_path}")

    # Stats finales
    print(f"\n{'='*60}")
    print("STATISTIQUES FINALES")
    print(f"{'='*60}")
    print(f"Total enregistrements: {len(final_records)}")

    with_phone = sum(1 for r in final_records if r.get('telephone'))
    print(f"Avec téléphone: {with_phone} ({100*with_phone//len(final_records)}%)")

    by_source = {}
    for r in final_records:
        src = r.get('sources', 'unknown')
        by_source[src] = by_source.get(src, 0) + 1
    print("\nPar source:")
    for src, count in sorted(by_source.items()):
        print(f"  {src}: {count}")


if __name__ == '__main__':
    main()
