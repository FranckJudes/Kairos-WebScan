"""
Service d'envoi d'emails - Configuration pour MailHog en développement
Supporte aussi les SMTP standards pour la production
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, List
from dataclasses import dataclass
from jinja2 import Template
import logging

logger = logging.getLogger(__name__)


@dataclass
class EmailConfig:
    """Configuration SMTP pour l'envoi d'emails"""
    smtp_server: str = os.getenv("SMTP_SERVER", "mailhog")
    smtp_port: int = int(os.getenv("SMTP_PORT", "1025"))
    smtp_username: Optional[str] = os.getenv("SMTP_USERNAME", None)
    smtp_password: Optional[str] = os.getenv("SMTP_PASSWORD", None)
    smtp_use_tls: bool = os.getenv("SMTP_USE_TLS", "false").lower() == "true"
    from_email: str = os.getenv("FROM_EMAIL", "noreply@kairos-webscan.com")
    from_name: str = os.getenv("FROM_NAME", "Kairos WebScan")
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:5173")


class EmailTemplate:
    """Templates HTML pour les emails"""

    BASE_TEMPLATE = """
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{{ subject }}</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f4f4f4;
                margin: 0;
                padding: 20px;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
                background: linear-gradient(135deg, #106EBE 0%, #0a5a9e 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
                font-weight: 600;
            }
            .content {
                padding: 40px 30px;
            }
            .content h2 {
                color: #106EBE;
                margin-top: 0;
            }
            .button {
                display: inline-block;
                padding: 12px 30px;
                background: #106EBE;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
                font-weight: 600;
            }
            .button:hover {
                background: #0a5a9e;
            }
            .footer {
                background: #f8f8f8;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #666;
                border-top: 1px solid #e0e0e0;
            }
            .alert {
                padding: 15px;
                background: #fff3cd;
                border-left: 4px solid #ffc107;
                margin: 20px 0;
                border-radius: 4px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Kairos WebScan</h1>
            </div>
            <div class="content">
                {{ content | safe }}
            </div>
            <div class="footer">
                <p>Cet email a été envoyé automatiquement, merci de ne pas répondre.</p>
                <p>&copy; 2025 Kairos WebScan. Tous droits réservés.</p>
            </div>
        </div>
    </body>
    </html>
    """

    @staticmethod
    def verification_email(user_name: str, verification_url: str) -> str:
        """Template pour l'email de vérification"""
        content = f"""
            <h2>Bienvenue sur Kairos WebScan 👋</h2>
            <p>Bonjour <strong>{user_name}</strong>,</p>
            <p>Merci de vous être inscrit sur Kairos WebScan. Pour activer votre compte et commencer à utiliser notre service, veuillez vérifier votre adresse email.</p>
            <p>Cliquez sur le bouton ci-dessous pour vérifier votre adresse email :</p>
            <div style="text-align: center;">
                <a href="{verification_url}" class="button">Vérifier mon email</a>
            </div>
            <p>Ou copiez ce lien dans votre navigateur :</p>
            <p style="background: #f4f4f4; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px;">
                {verification_url}
            </p>
            <div class="alert">
                <strong>⚠️ Important :</strong> Ce lien expire dans 24 heures.
            </div>
            <p>Si vous n'avez pas créé de compte Kairos WebScan, vous pouvez ignorer cet email.</p>
        """
        return Template(EmailTemplate.BASE_TEMPLATE).render(subject="Vérifiez votre adresse email", content=content)

    @staticmethod
    def password_reset_email(user_name: str, reset_url: str) -> str:
        """Template pour l'email de réinitialisation"""
        content = f"""
            <h2>Réinitialisation de votre mot de passe</h2>
            <p>Bonjour <strong>{user_name}</strong>,</p>
            <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
            <div style="text-align: center;">
                <a href="{reset_url}" class="button">Réinitialiser mon mot de passe</a>
            </div>
            <p>Ou copiez ce lien dans votre navigateur :</p>
            <p style="background: #f4f4f4; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px;">
                {reset_url}
            </p>
            <div class="alert">
                <strong> Important :</strong> Ce lien expire dans 1 heure.
            </div>
            <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email. Votre mot de passe restera inchangé.</p>
        """
        return Template(EmailTemplate.BASE_TEMPLATE).render(subject="Réinitialisation de votre mot de passe", content=content)

    @staticmethod
    def welcome_email(user_name: str, frontend_url: str) -> str:
        """Template pour l'email de bienvenue après vérification"""
        content = f"""
            <h2>Votre compte est activé ! 🎉</h2>
            <p>Bonjour <strong>{user_name}</strong>,</p>
            <p>Félicitations ! Votre compte Kairos WebScan est maintenant actif.</p>
            <p>Vous pouvez désormais :</p>
            <ul style="line-height: 2;">
                <li>Numériser vos documents</li>
                <li>Organiser vos fichiers avec notre système intelligent</li>
                <li>Gérer vos profils de scan personnalisés</li>
                <li>Classifier automatiquement vos documents</li>
            </ul>
            <div style="text-align: center;">
                <a href="{frontend_url}" class="button">Accéder à Kairos WebScan</a>
            </div>
            <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
        """
        return Template(EmailTemplate.BASE_TEMPLATE).render(subject="Bienvenue sur Kairos WebScan !", content=content)


class EmailService:
    """Service d'envoi d'emails"""

    def __init__(self, config: Optional[EmailConfig] = None):
        """
        Initialise le service d'email

        Args:
            config: Configuration SMTP (utilise EmailConfig() par défaut)
        """
        self.config = config or EmailConfig()

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        to_name: Optional[str] = None
    ) -> bool:
        """
        Envoie un email

        Args:
            to_email: Adresse email du destinataire
            subject: Sujet de l'email
            html_content: Contenu HTML de l'email
            to_name: Nom du destinataire (optionnel)

        Returns:
            True si l'envoi a réussi, False sinon
        """
        try:
            # Créer le message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.config.from_name} <{self.config.from_email}>"
            msg['To'] = f"{to_name} <{to_email}>" if to_name else to_email

            # Attacher le contenu HTML
            html_part = MIMEText(html_content, 'html', 'utf-8')
            msg.attach(html_part)

            # Connexion SMTP
            if self.config.smtp_use_tls:
                # SMTP avec TLS (ex: Gmail, SendGrid)
                server = smtplib.SMTP(self.config.smtp_server, self.config.smtp_port)
                server.starttls()
                if self.config.smtp_username and self.config.smtp_password:
                    server.login(self.config.smtp_username, self.config.smtp_password)
            else:
                server = smtplib.SMTP(self.config.smtp_server, self.config.smtp_port)

            server.send_message(msg)
            server.quit()

            return True

        except Exception as e:
            return False

    def send_verification_email(
        self,
        to_email: str,
        to_name: str,
        verification_token: str
    ) -> bool:
        """
        Envoie un email de vérification

        Args:
            to_email: Adresse email du destinataire
            to_name: Nom du destinataire
            verification_token: Token de vérification

        Returns:
            True si l'envoi a réussi
        """
        verification_url = f"{self.config.frontend_url}/register/confirmation?token={verification_token}"
        html_content = EmailTemplate.verification_email(to_name, verification_url)

        return self.send_email(
            to_email=to_email,
            subject="Vérifiez votre adresse email - Kairos WebScan",
            html_content=html_content,
            to_name=to_name
        )

    def send_password_reset_email(
        self,
        to_email: str,
        to_name: str,
        reset_token: str
    ) -> bool:
        """
        Envoie un email de réinitialisation de mot de passe

        Args:
            to_email: Adresse email du destinataire
            to_name: Nom du destinataire
            reset_token: Token de réinitialisation

        Returns:
            True si l'envoi a réussi
        """
        reset_url = f"{self.config.frontend_url}/reset-password?token={reset_token}"
        html_content = EmailTemplate.password_reset_email(to_name, reset_url)

        return self.send_email(
            to_email=to_email,
            subject="Réinitialisation de votre mot de passe - Kairos WebScan",
            html_content=html_content,
            to_name=to_name
        )

    def send_welcome_email(
        self,
        to_email: str,
        to_name: str
    ) -> bool:
        """
        Envoie un email de bienvenue après vérification

        Args:
            to_email: Adresse email du destinataire
            to_name: Nom du destinataire

        Returns:
            True si l'envoi a réussi
        """
        html_content = EmailTemplate.welcome_email(to_name, self.config.frontend_url)

        return self.send_email(
            to_email=to_email,
            subject="Bienvenue sur Kairos WebScan !",
            html_content=html_content,
            to_name=to_name
        )


# Instance singleton pour utilisation dans l'application
def get_email_service() -> EmailService:
    """Retourne l'instance du service d'email"""
    return EmailService()
