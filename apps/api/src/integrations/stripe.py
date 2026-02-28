"""Stripe payment integration."""

from typing import Optional
import stripe

from ..config import get_settings

settings = get_settings()
stripe.api_key = settings.STRIPE_SECRET_KEY


class StripeService:
    """Stripe Connect payment service."""

    async def create_payment_intent(
        self,
        amount: int,
        currency: str,
        order_id: str,
        customer_id: str,
        plumber_stripe_account_id: Optional[str] = None,
        platform_fee: int = 0,
    ):
        """Create a PaymentIntent for split payment."""
        params = {
            "amount": amount,
            "currency": currency,
            "metadata": {
                "order_id": order_id,
                "customer_id": customer_id,
            },
            "capture_method": "manual",  # Authorize now, capture after job completion
        }

        # If plumber has Stripe Connect, set up split payment
        if plumber_stripe_account_id and platform_fee > 0:
            params["transfer_data"] = {
                "destination": plumber_stripe_account_id,
            }
            params["application_fee_amount"] = platform_fee

        return stripe.PaymentIntent.create(**params)

    async def get_payment_intent(self, payment_intent_id: str):
        """Get PaymentIntent by ID."""
        return stripe.PaymentIntent.retrieve(payment_intent_id)

    async def capture_payment(self, payment_intent_id: str) -> bool:
        """Capture an authorized payment."""
        try:
            stripe.PaymentIntent.capture(payment_intent_id)
            return True
        except stripe.error.StripeError:
            return False

    async def refund_payment(
        self,
        payment_intent_id: str,
        amount: Optional[int] = None,
    ) -> bool:
        """Refund a payment (full or partial)."""
        try:
            params = {"payment_intent": payment_intent_id}
            if amount:
                params["amount"] = amount
            stripe.Refund.create(**params)
            return True
        except stripe.error.StripeError:
            return False

    async def create_connect_account(self, email: str, country: str = "FR"):
        """Create a Stripe Connect Express account for a plumber."""
        return stripe.Account.create(
            type="express",
            country=country,
            email=email,
            capabilities={
                "card_payments": {"requested": True},
                "transfers": {"requested": True},
            },
        )

    async def create_account_link(
        self,
        account_id: str,
        refresh_url: str,
        return_url: str,
    ):
        """Create an account link for Stripe Connect onboarding."""
        return stripe.AccountLink.create(
            account=account_id,
            refresh_url=refresh_url,
            return_url=return_url,
            type="account_onboarding",
        )

    async def get_account(self, account_id: str):
        """Get Stripe Connect account details."""
        return stripe.Account.retrieve(account_id)

    def verify_webhook(self, payload: bytes, sig_header: str):
        """Verify Stripe webhook signature."""
        try:
            return stripe.Webhook.construct_event(
                payload,
                sig_header,
                settings.STRIPE_WEBHOOK_SECRET,
            )
        except (stripe.error.SignatureVerificationError, ValueError):
            return None
