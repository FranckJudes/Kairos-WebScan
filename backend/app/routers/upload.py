"""
API pour l'upload de documents avec sauvegarde et thumbnails
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import logging
import os
import uuid
import aiofiles
from PIL import Image
import io

from ..database import get_db
from ..cache import get_cache
from ..websocket import get_manager
from ..models.classification import Document
from ..routers.documents import generate_image_thumbnail, generate_placeholder_thumbnail

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["Documents"])

# Configuration
UPLOAD_DIR = "uploads"
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".gif"}
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB


def get_upload_dir():
    """Crée le répertoire d'upload s'il n'existe pas"""
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)
    return UPLOAD_DIR


def validate_file(file: UploadFile) -> tuple[bool, str]:
    """
    Valide le fichier uploadé

    Returns:
        (is_valid, error_message)
    """
    # Vérifier l'extension
    filename = file.filename.lower()
    ext = os.path.splitext(filename)[1]

    if ext not in ALLOWED_EXTENSIONS:
        return False, f"Extension non autorisée. Autorisé: {', '.join(ALLOWED_EXTENSIONS)}"

    # Vérifier le type MIME
    if not file.content_type:
        return False, "Type de fichier non détecté"

    allowed_mimes = {
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/tiff",
        "image/bmp",
        "image/gif"
    }

    if file.content_type not in allowed_mimes:
        return False, f"Type de fichier non autorisé: {file.content_type}"

    return True, ""


async def count_pdf_pages(file_path: str) -> int:
    """
    Compte le nombre de pages d'un PDF et valide sa structure avec pypdf (plus strict)

    Args:
        file_path: Chemin vers le fichier PDF

    Returns:
        Nombre de pages

    Raises:
        ValueError: Si le PDF est corrompu ou invalide
    """
    try:
        from pypdf import PdfReader
        import re

        # Première validation avec pypdf (plus strict)
        try:
            reader = PdfReader(file_path)
            num_pages = len(reader.pages)

            # Vérifier les métadonnées pour détecter les PDFs malformés
            if reader.metadata:
                for key, value in reader.metadata.items():
                    if value:
                        # Détecter les motifs suspects dans les métadonnées
                        value_str = str(value)
                        # Motif typique des PDFs malformés : caractères invalides répétés
                        if re.search(r'[!-~]{20,}', value_str):
                            raise ValueError(
                                "PDF avec structure non-standard détectée dans les métadonnées. "
                                "Le PDF a probablement été mal généré. "
                                "Veuillez le ré-exporter depuis l'application source."
                            )

            logger.info(f"✅ PDF validé par pypdf: {num_pages} pages")
            return num_pages

        except ValueError:
            raise
        except Exception as e:
            error_msg = str(e)
            if "non-standard" in error_msg or "malformé" in error_msg:
                raise
            logger.warning(f"pypdf validation échouée: {e}, essai avec PyMuPDF")

        # Fallback vers PyMuPDF si pypdf n'est pas disponible ou échoue
        import fitz

        # Ouvrir le PDF avec validation stricte
        doc = fitz.open(file_path)

        # Vérifier que le document est bien un PDF
        if not doc.is_pdf:
            doc.close()
            raise ValueError("Le fichier n'est pas un PDF valide")

        # Essayer d'accéder à la première page pour valider la structure
        if doc.page_count > 0:
            try:
                first_page = doc[0]
                # Vérifier qu'on peut lire le contenu de la page
                _ = first_page.rect
            except Exception as e:
                doc.close()
                raise ValueError(f"Structure du PDF invalide: {str(e)}")

        num_pages = doc.page_count
        doc.close()
        return num_pages

    except ImportError:
        logger.warning("pypdf/PyMuPDF non installé, impossible de valider le PDF")
        return 1
    except ValueError:
        # Re-lancer les erreurs de validation
        raise
    except Exception as e:
        error_msg = str(e)
        logger.error(f"PDF invalide ou corrompu: {error_msg}")
        raise ValueError(f"PDF invalide ou corrompu: {error_msg}")


async def generate_thumbnails_for_document(
    document_id: int,
    file_path: str,
    file_type: str,
    num_pages: int,
    cache
):
    """
    Génère les thumbnails pour toutes les pages d'un document (background task)

    Args:
        document_id: ID du document
        file_path: Chemin vers le fichier
        file_type: Type MIME du fichier
        num_pages: Nombre de pages
        cache: Gestionnaire de cache Redis
    """
    try:
        logger.info(f"🎨 Génération thumbnails pour document {document_id}")

        if file_type.startswith("image/"):
            # Pour une image, générer un seul thumbnail
            thumbnail_data = generate_image_thumbnail(file_path, width=150, height=200)
            if thumbnail_data and cache:
                cache.set_thumbnail(document_id, 1, thumbnail_data, ttl=86400)
                logger.info(f"✅ Thumbnail généré pour page 1")

        elif file_type == "application/pdf":
            # Pour un PDF, générer des thumbnails pour chaque page
            # Pour l'instant, on génère un placeholder
            # TODO: Utiliser pdf2image pour extraire les pages
            for page_num in range(1, min(num_pages + 1, 10)):  # Max 10 pages
                thumbnail_data = generate_placeholder_thumbnail(width=150, height=200)
                if thumbnail_data and cache:
                    cache.set_thumbnail(document_id, page_num, thumbnail_data, ttl=86400)

            logger.info(f"✅ Placeholders générés pour {num_pages} pages")

    except Exception as e:
        logger.error(f"❌ Erreur génération thumbnails: {e}")


@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload un document, le sauvegarde, et crée les thumbnails

    Args:
        file: Fichier uploadé
        background_tasks: Tâches en arrière-plan (thumbnails)

    Returns:
        Informations du document créé
    """
    cache = get_cache()
    manager = get_manager()

    # 1. Valider le fichier
    is_valid, error_msg = validate_file(file)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    # 2. Vérifier la taille
    file.file.seek(0, 2)  # Aller à la fin
    file_size = file.file.tell()
    file.file.seek(0)  # Retour au début

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"Fichier trop volumineux. Max: {MAX_FILE_SIZE / (1024*1024)} MB"
        )

    # 3. Générer un nom de fichier unique
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    upload_dir = get_upload_dir()
    file_path = os.path.join(upload_dir, unique_filename)

    # 4. Sauvegarder le fichier sur disque
    try:
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)

        logger.info(f"✅ Fichier sauvegardé: {file_path}")

    except Exception as e:
        logger.error(f"❌ Erreur sauvegarde fichier: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la sauvegarde du fichier")

    # 5. Compter le nombre de pages (pour PDF)
    num_pages = 1
    if file.content_type == "application/pdf":
        try:
            num_pages = await count_pdf_pages(file_path)
        except ValueError as e:
            # PDF invalide - supprimer le fichier et retourner erreur
            if os.path.exists(file_path):
                os.remove(file_path)
            logger.error(f"❌ PDF invalide rejeté: {file.filename}")
            raise HTTPException(status_code=400, detail=str(e))

    # 6. Créer l'entrée en base de données
    try:
        document = Document(
            filename=unique_filename,
            original_name=file.filename,
            file_path=file_path,
            file_type=file.content_type,
            file_size=file_size,
            num_pages=num_pages,
            status="completed"
        )

        db.add(document)
        db.commit()
        db.refresh(document)

        logger.info(f"✅ Document créé en DB: ID={document.id}")

    except Exception as e:
        # Supprimer le fichier si erreur DB
        if os.path.exists(file_path):
            os.remove(file_path)

        logger.error(f"❌ Erreur création DB: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la création en base de données")

    # 7. Générer les thumbnails en arrière-plan
    background_tasks.add_task(
        generate_thumbnails_for_document,
        document.id,
        file_path,
        file.content_type,
        num_pages,
        cache
    )

    # 8. Notifier via WebSocket
    await manager.notify_document_scanned({
        "document_id": document.id,
        "filename": document.original_name,
        "file_type": document.file_type,
        "num_pages": document.num_pages,
        "file_size": document.file_size
    })

    # 9. Retourner les infos du document
    return {
        "success": True,
        "message": "Document uploadé avec succès",
        "document": {
            "id": document.id,
            "filename": document.filename,
            "original_name": document.original_name,
            "file_type": document.file_type,
            "file_size": document.file_size,
            "num_pages": document.num_pages,
            "status": document.status,
            "created_at": document.created_at.isoformat() if document.created_at else None,
            "url": f"/uploads/{document.filename}"
        }
    }


@router.post("/upload/batch")
async def upload_documents_batch(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload plusieurs documents en une fois

    Args:
        files: Liste des fichiers uploadés

    Returns:
        Liste des documents créés
    """
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 fichiers à la fois")

    results = []
    cache = get_cache()

    for file in files:
        try:
            # Réutiliser la logique d'upload simple
            result = await upload_document(background_tasks, file, db)
            results.append({
                "success": True,
                "document": result["document"]
            })
        except HTTPException as e:
            results.append({
                "success": False,
                "filename": file.filename,
                "error": e.detail
            })
        except Exception as e:
            results.append({
                "success": False,
                "filename": file.filename,
                "error": str(e)
            })

    # Compter les succès
    success_count = sum(1 for r in results if r["success"])

    return {
        "success": True,
        "message": f"{success_count}/{len(files)} fichier(s) uploadé(s)",
        "results": results
    }
