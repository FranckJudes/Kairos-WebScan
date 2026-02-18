from .celery_app import celery_app
from .services.email import get_email_service
from .services.pdf_processor import get_pdf_processor
import logging
import asyncio
import json
from pathlib import Path

logger = logging.getLogger(__name__)

UPLOAD_DIR = "uploads"


@celery_app.task(name="app.tasks.send_verification_email")
def send_verification_email(to_email: str, to_name: str, verification_token: str):
    """Tâche Celery pour envoyer l'email de vérification"""
    email_service = get_email_service()
    success = email_service.send_verification_email(to_email, to_name, verification_token)
    if not success:
        logger.error(f"Échec de l'envoi de l'email de vérification à {to_email}")
    return success


@celery_app.task(name="app.tasks.send_password_reset_email")
def send_password_reset_email(to_email: str, to_name: str, reset_token: str):
    """Tâche Celery pour envoyer l'email de réinitialisation de mot de passe"""
    email_service = get_email_service()
    success = email_service.send_password_reset_email(to_email, to_name, reset_token)
    if not success:
        logger.error(f"Échec de l'envoi de l'email de réinitialisation à {to_email}")
    return success


@celery_app.task(name="app.tasks.send_welcome_email")
def send_welcome_email(to_email: str, to_name: str):
    """Tâche Celery pour envoyer l'email de bienvenue"""
    email_service = get_email_service()
    success = email_service.send_welcome_email(to_email, to_name)
    if not success:
        logger.error(f"Échec de l'envoi de l'email de bienvenue à {to_email}")
    return success


@celery_app.task(name="app.tasks.process_pdf_document", bind=True)
def process_pdf_document(self, document_id: str, filename: str, user_id: str):
    """
    Tâche Celery pour traiter un PDF en arrière-plan et extraire les pages
    Utilise Redis Pub/Sub pour communiquer avec FastAPI

    Args:
        document_id: ID du document
        filename: Nom du fichier PDF
        user_id: ID de l'utilisateur

    Returns:
        Dict avec le résultat du traitement
    """

    try:
        # Chemin du fichier PDF
        pdf_path = Path(UPLOAD_DIR) / filename

        if not pdf_path.exists():
            return {"status": "error", "message": "Fichier non trouvé"}

        processor = get_pdf_processor()

        try:
            import redis as redis_lib
            redis_client = redis_lib.Redis.from_url(
                "redis://localhost:6379/0",
                decode_responses=True
            )

            try:
                redis_client.ping()
            except Exception as e:
                return {"status": "error", "message": "Redis non disponible"}

            def publish_progress(page_data):
                """Publie la progression sur Redis"""
                message = {
                    "type": "document_processing",
                    "data": page_data
                }
                redis_client.publish("document_updates", json.dumps(message))

            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

            async def progress_callback(page_data):
                """Callback appelé pour chaque page traitée"""
                publish_progress(page_data)

            pages = loop.run_until_complete(
                processor.process_pdf_async(
                    str(pdf_path),
                    document_id,
                    progress_callback
                )
            )

            # Publier le résultat final
            result = {
                "status": "completed",
                "document_id": document_id,
                "total_pages": len(pages),
                "pages": pages,
                "progress": 100
            }
            publish_progress(result)

            loop.close()
            redis_client.close()

            return result

        except Exception as redis_error:
            return {"status": "error", "message": f"Erreur Redis: {str(redis_error)}"}

    except Exception as e:
        return {
            "status": "error",
            "document_id": document_id,
            "error": str(e)
        }
