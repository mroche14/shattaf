"""Utilitaires pour l'extraction des plombiers DOM."""

import re
from typing import Optional


def normalize_phone(phone: str) -> Optional[str]:
    """Normalise un numéro de téléphone français."""
    if not phone:
        return None

    # Supprimer tous les caractères non numériques
    digits = re.sub(r'\D', '', phone)

    # Gérer le préfixe international
    if digits.startswith('33'):
        digits = '0' + digits[2:]
    elif digits.startswith('0033'):
        digits = '0' + digits[4:]

    # Vérifier la longueur
    if len(digits) != 10:
        return None

    # Formater
    return f"{digits[:2]} {digits[2:4]} {digits[4:6]} {digits[6:8]} {digits[8:10]}"


def normalize_siren(siren: str) -> Optional[str]:
    """Normalise un numéro SIREN (9 chiffres)."""
    if not siren:
        return None

    digits = re.sub(r'\D', '', str(siren))

    if len(digits) == 9:
        return digits
    elif len(digits) == 14:  # SIRET, extraire SIREN
        return digits[:9]

    return None


def normalize_siret(siret: str) -> Optional[str]:
    """Normalise un numéro SIRET (14 chiffres)."""
    if not siret:
        return None

    digits = re.sub(r'\D', '', str(siret))

    if len(digits) == 14:
        return digits

    return None


def extract_departement(code_postal: str) -> Optional[str]:
    """Extrait le département d'un code postal DOM."""
    if not code_postal:
        return None

    cp = str(code_postal).strip()

    if cp.startswith('971'):
        return '971'
    elif cp.startswith('972'):
        return '972'
    elif cp.startswith('973'):
        return '973'
    elif cp.startswith('974'):
        return '974'

    return None


def normalize_email(email: str) -> Optional[str]:
    """Normalise une adresse email."""
    if not email:
        return None

    email = email.strip().lower()

    # Validation basique
    if re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', email):
        return email

    return None


def normalize_raison_sociale(nom: str) -> str:
    """Normalise une raison sociale pour comparaison."""
    if not nom:
        return ''

    nom = nom.upper().strip()

    # Supprimer les formes juridiques courantes
    formes = ['SARL', 'EURL', 'SAS', 'SASU', 'SA', 'EI', 'EIRL', 'SCI', 'SELARL']
    for forme in formes:
        nom = re.sub(rf'\b{forme}\b', '', nom)

    # Supprimer ponctuation et espaces multiples
    nom = re.sub(r'[^\w\s]', ' ', nom)
    nom = re.sub(r'\s+', ' ', nom)

    return nom.strip()


def calculate_similarity(str1: str, str2: str) -> float:
    """Calcule la similarité entre deux chaînes (0-1)."""
    if not str1 or not str2:
        return 0.0

    str1 = normalize_raison_sociale(str1)
    str2 = normalize_raison_sociale(str2)

    if str1 == str2:
        return 1.0

    # Jaccard sur les mots
    words1 = set(str1.split())
    words2 = set(str2.split())

    if not words1 or not words2:
        return 0.0

    intersection = len(words1 & words2)
    union = len(words1 | words2)

    return intersection / union if union > 0 else 0.0
