"""AI Devis service — Claude API integration for automated quote generation."""

import json
import logging
from typing import Optional

from ..config import get_settings

logger = logging.getLogger(__name__)

# DOM-TOM VAT rate (taux réduit)
DOM_VAT_RATE = 0.085

SYSTEM_PROMPT = """Tu es un assistant spécialisé dans l'estimation de devis de plomberie pour les DOM-TOM français (Guadeloupe 971, Martinique 972, Guyane 973).

Règles de tarification DOM-TOM :
- TVA réduite : 8,5% (taux applicable dans les DOM)
- Main d'œuvre : entre 35€ et 55€/heure selon la complexité
- Déplacement forfaitaire : 25€ à 45€ selon la zone
- Matériaux : majoration de 15-25% par rapport à la métropole (coût d'acheminement)
- Urgence : majoration de 50% sur la main d'œuvre si intervention sous 24-48h

Catégories et fourchettes indicatives :
- plomberie_generale : 80€ - 400€ (diagnostic, petites réparations)
- fuite : 60€ - 250€ (réparation de fuites simples à complexes)
- installation : 150€ - 800€ (installation sanitaire neuve)
- chauffe_eau : 200€ - 1200€ (remplacement ou réparation chauffe-eau)
- debouchage : 80€ - 350€ (débouchage canalisation)

Tu dois retourner un JSON valide avec cette structure exacte :
{
  "line_items": [
    {"description": "...", "quantity": 1, "unit_price_cents": 5000, "item_type": "labor|material|travel"}
  ],
  "estimated_duration_minutes": 60,
  "confidence": 0.8,
  "reasoning": "Explication courte du devis"
}

Retourne UNIQUEMENT le JSON, sans texte avant ou après."""


async def generate_ai_devis(
    category: str,
    description: str,
    city: Optional[str] = None,
    postal_code: Optional[str] = None,
    urgency: Optional[str] = None,
    plumber_notes: Optional[str] = None,
) -> dict:
    """Generate an AI devis draft using Claude API.

    Returns a dict with line_items, estimated_duration_minutes, confidence, reasoning.
    Falls back to a template-based estimate if the API call fails.
    """
    settings = get_settings()
    anthropic_key = getattr(settings, "ANTHROPIC_API_KEY", "")

    if not anthropic_key:
        logger.warning("ANTHROPIC_API_KEY not set, using template-based estimate")
        return _template_estimate(category, urgency)

    try:
        import anthropic

        client = anthropic.AsyncAnthropic(api_key=anthropic_key)

        user_prompt = f"""Génère un devis pour cette demande de plomberie :

Catégorie : {category}
Description du client : {description}
Ville : {city or "Non précisée"}
Code postal : {postal_code or "Non précisé"}
Urgence : {urgency or "normal"}
"""
        if plumber_notes:
            user_prompt += f"Notes du plombier : {plumber_notes}\n"

        message = await client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
        )

        # Parse the response
        response_text = message.content[0].text.strip()
        # Handle potential markdown code blocks
        if response_text.startswith("```"):
            response_text = response_text.split("\n", 1)[1]
            response_text = response_text.rsplit("```", 1)[0].strip()

        result = json.loads(response_text)
        return result

    except Exception as e:
        logger.error(f"AI devis generation failed: {e}")
        return _template_estimate(category, urgency)


def _template_estimate(category: str, urgency: Optional[str] = None) -> dict:
    """Fallback template-based estimate when AI is unavailable."""

    templates = {
        "plomberie_generale": {
            "line_items": [
                {"description": "Diagnostic et main d'œuvre", "quantity": 1, "unit_price_cents": 12000, "item_type": "labor"},
                {"description": "Déplacement", "quantity": 1, "unit_price_cents": 3500, "item_type": "travel"},
            ],
            "estimated_duration_minutes": 60,
        },
        "fuite": {
            "line_items": [
                {"description": "Réparation de fuite", "quantity": 1, "unit_price_cents": 9000, "item_type": "labor"},
                {"description": "Joints et raccords", "quantity": 1, "unit_price_cents": 2500, "item_type": "material"},
                {"description": "Déplacement", "quantity": 1, "unit_price_cents": 3500, "item_type": "travel"},
            ],
            "estimated_duration_minutes": 45,
        },
        "installation": {
            "line_items": [
                {"description": "Installation sanitaire", "quantity": 1, "unit_price_cents": 25000, "item_type": "labor"},
                {"description": "Fournitures et raccordement", "quantity": 1, "unit_price_cents": 15000, "item_type": "material"},
                {"description": "Déplacement", "quantity": 1, "unit_price_cents": 3500, "item_type": "travel"},
            ],
            "estimated_duration_minutes": 120,
        },
        "chauffe_eau": {
            "line_items": [
                {"description": "Remplacement chauffe-eau (main d'œuvre)", "quantity": 1, "unit_price_cents": 30000, "item_type": "labor"},
                {"description": "Chauffe-eau + raccords", "quantity": 1, "unit_price_cents": 45000, "item_type": "material"},
                {"description": "Déplacement", "quantity": 1, "unit_price_cents": 3500, "item_type": "travel"},
            ],
            "estimated_duration_minutes": 180,
        },
        "debouchage": {
            "line_items": [
                {"description": "Débouchage canalisation", "quantity": 1, "unit_price_cents": 12000, "item_type": "labor"},
                {"description": "Produits et consommables", "quantity": 1, "unit_price_cents": 2000, "item_type": "material"},
                {"description": "Déplacement", "quantity": 1, "unit_price_cents": 3500, "item_type": "travel"},
            ],
            "estimated_duration_minutes": 45,
        },
    }

    template = templates.get(category, templates["plomberie_generale"])

    # Apply urgency markup
    if urgency == "urgent":
        for item in template["line_items"]:
            if item["item_type"] == "labor":
                item["unit_price_cents"] = int(item["unit_price_cents"] * 1.5)

    return {
        **template,
        "confidence": 0.5,
        "reasoning": "Estimation basée sur un modèle standard (IA indisponible)",
    }
