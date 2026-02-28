"""Email and SMS notification service (Brevo)."""

from typing import Optional
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException

from ..config import get_settings

settings = get_settings()


class NotificationService:
    """Brevo (formerly Sendinblue) notification service."""

    def __init__(self):
        if settings.BREVO_API_KEY:
            configuration = sib_api_v3_sdk.Configuration()
            configuration.api_key["api-key"] = settings.BREVO_API_KEY
            self.email_api = sib_api_v3_sdk.TransactionalEmailsApi(
                sib_api_v3_sdk.ApiClient(configuration)
            )
            self.sms_api = sib_api_v3_sdk.TransactionalSMSApi(
                sib_api_v3_sdk.ApiClient(configuration)
            )
        else:
            self.email_api = None
            self.sms_api = None

    async def send_email(
        self,
        to_email: str,
        to_name: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
    ) -> bool:
        """Send transactional email."""
        if not self.email_api:
            return False

        try:
            send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
                sender=sib_api_v3_sdk.SendSmtpEmailSender(
                    name=settings.BREVO_SENDER_NAME,
                    email=settings.BREVO_SENDER_EMAIL,
                ),
                to=[sib_api_v3_sdk.SendSmtpEmailTo(email=to_email, name=to_name)],
                subject=subject,
                html_content=html_content,
                text_content=text_content,
            )
            self.email_api.send_transac_email(send_smtp_email)
            return True
        except ApiException:
            return False

    async def send_sms(
        self,
        phone: str,
        content: str,
    ) -> bool:
        """Send transactional SMS."""
        if not self.sms_api:
            return False

        try:
            send_transac_sms = sib_api_v3_sdk.SendTransacSms(
                sender="Shattaf",
                recipient=phone,
                content=content,
            )
            self.sms_api.send_transac_sms(send_transac_sms)
            return True
        except ApiException:
            return False

    # Email templates

    async def send_booking_confirmation(
        self,
        email: str,
        name: str,
        booking_id: str,
    ) -> bool:
        """Send booking confirmation email."""
        subject = "Votre demande d'installation Shattaf est enregistrée"
        html = f"""
        <h2>Bonjour {name},</h2>
        <p>Votre demande d'installation a bien été enregistrée.</p>
        <p>Référence: <strong>{booking_id}</strong></p>
        <p>Un plombier partenaire vous contactera sous 24h avec un devis.</p>
        <br>
        <p>L'équipe Oasis Shattaf</p>
        """
        return await self.send_email(email, name, subject, html)

    async def send_quote_received(
        self,
        email: str,
        name: str,
        plumber_name: str,
        total_price: int,
    ) -> bool:
        """Send quote notification to customer."""
        price_eur = total_price / 100
        subject = f"Nouveau devis Shattaf - {price_eur:.2f}€"
        html = f"""
        <h2>Bonjour {name},</h2>
        <p>Vous avez reçu un devis de <strong>{plumber_name}</strong>.</p>
        <p>Montant total: <strong>{price_eur:.2f}€ TTC</strong></p>
        <p>Connectez-vous pour accepter ou refuser ce devis.</p>
        <br>
        <p>L'équipe Oasis Shattaf</p>
        """
        return await self.send_email(email, name, subject, html)

    async def send_job_assigned_sms(
        self,
        phone: str,
        plumber_name: str,
        date_str: str,
        time_slot: str,
    ) -> bool:
        """Send job assignment SMS to plumber."""
        content = f"Nouvelle mission Shattaf le {date_str} ({time_slot}). Consultez l'app pour les détails."
        return await self.send_sms(phone, content)

    async def send_job_completed(
        self,
        email: str,
        name: str,
        order_number: str,
    ) -> bool:
        """Send job completion email to customer."""
        subject = "Installation terminée - Votre facture Shattaf"
        html = f"""
        <h2>Bonjour {name},</h2>
        <p>Votre installation a été réalisée avec succès !</p>
        <p>Commande: <strong>{order_number}</strong></p>
        <p>Votre facture est disponible dans votre espace client.</p>
        <p>N'hésitez pas à nous laisser un avis.</p>
        <br>
        <p>L'équipe Oasis Shattaf</p>
        """
        return await self.send_email(email, name, subject, html)
