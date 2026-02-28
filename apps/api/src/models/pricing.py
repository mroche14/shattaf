"""Pricing configuration model."""

from typing import Optional
from sqlmodel import Field

from .base import BaseModel


class PricingConfig(BaseModel, table=True):
    """Platform pricing configuration.

    Single row table for global pricing settings.
    All amounts in EUR cents.
    """

    __tablename__ = "pricing_config"

    # Only one config row
    name: str = Field(default="default", unique=True, index=True)

    # Plumber fees (in cents)
    plumber_travel_fee: int = Field(default=2000)  # 20€ - déplacement (first unit only)
    plumber_labor_fee: int = Field(default=5000)   # 50€ - main d'œuvre (per unit)

    # Platform commission (in cents)
    commission_first_unit: int = Field(default=4000)   # 40€ - first shattaf
    commission_additional: int = Field(default=1000)   # 10€ - each additional

    # B2B discount percentage
    b2b_discount_percent: int = Field(default=15)  # 15% discount for pros

    # Description for admin
    notes: Optional[str] = None

    @classmethod
    def calculate_price(
        cls,
        supplier_price: int,
        is_first_unit: bool = True,
        is_b2b: bool = False,
        config: Optional["PricingConfig"] = None
    ) -> dict:
        """Calculate final price breakdown.

        Args:
            supplier_price: Product cost in cents
            is_first_unit: Whether this is the first unit (includes travel)
            is_b2b: Whether this is a B2B order
            config: Pricing config (uses defaults if None)

        Returns:
            dict with price breakdown
        """
        # Use defaults if no config provided
        travel = 2000 if is_first_unit else 0
        labor = 5000
        commission = 4000 if is_first_unit else 1000

        if config:
            travel = config.plumber_travel_fee if is_first_unit else 0
            labor = config.plumber_labor_fee
            commission = config.commission_first_unit if is_first_unit else config.commission_additional

        subtotal = supplier_price + travel + labor + commission

        # B2B discount on commission only
        if is_b2b and config:
            discount = int(commission * config.b2b_discount_percent / 100)
            commission -= discount
            subtotal -= discount

        return {
            "supplier_price": supplier_price,
            "plumber_travel": travel,
            "plumber_labor": labor,
            "platform_commission": commission,
            "total": subtotal,
            "is_first_unit": is_first_unit,
            "is_b2b": is_b2b,
        }
