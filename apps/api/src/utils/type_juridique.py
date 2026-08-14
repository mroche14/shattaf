"""Legal form (forme juridique) classification utilities.

Maps INSEE forme_juridique codes to human-readable type labels.
Shared by schemas and services to avoid circular imports.
"""

from collections import defaultdict
from typing import Optional

# Maps INSEE forme_juridique codes to human-readable type labels.
FORME_JURIDIQUE_MAP: dict[str, str] = {
    "1000": "EI",
    "5710": "SAS",
    "5202": "EURL",
    "5453": "EURL",
    "5499": "SARL",
}

# Types considered as solo (one-person) structures
SOLO_TYPES = {"EI", "SAS", "EURL"}

# Reverse lookup: type_juridique label → set of INSEE codes
TYPE_TO_CODES: dict[str, set[str]] = defaultdict(set)
for _code, _label in FORME_JURIDIQUE_MAP.items():
    TYPE_TO_CODES[_label].add(_code)
# Virtual "solo" key = union of all solo-type codes
TYPE_TO_CODES["solo"] = {c for c, t in FORME_JURIDIQUE_MAP.items() if t in SOLO_TYPES}


def get_type_juridique(forme_juridique: Optional[str]) -> str:
    """Derive a readable legal form type from the INSEE code."""
    if not forme_juridique:
        return "inconnu"
    return FORME_JURIDIQUE_MAP.get(forme_juridique, "autre")
