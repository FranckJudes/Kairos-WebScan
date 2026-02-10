"""
API pour la gestion des documents avec pagination et cache thumbnails
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import logging
import base64
from PIL import Image
import io
import os

from ..database import get_db
from ..cache import get_cache
from ..websocket import get_manager
from ..models.classification import Document

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["Documents"])


class PageInfo:
    """Informations sur une page de document"""
    def __init__(self, page_number: int, document_id: int, document_name: str,
                 file_type: str, url: str, size: int):
        self.page_number = page_number
        self.document_id = document_id
        self.document_name = document_name
        self.file_type = file_type
        self.url = url
        self.size = size


class PageResponse:
    """Réponse pour une page"""
    def __init__(self, page: PageInfo, thumbnail_url: Optional[str] = None):
        self.id = f"{page.document_id}-page-{page.page_number}"
        self.documentId = page.document_id
        self.documentName = page.document_name
        self.pageNumber = page.page_number
        self.type = page.file_type
        self.url = page.url
        self.size = page.size
        self.rotation = 0
        self.thumbnailUrl = thumbnail_url

    def to_dict(self):
        return {
            "id": self.id,
            "documentId": self.documentId,
            "documentName": self.documentName,
            "pageNumber": self.pageNumber,
            "type": self.type,
            "url": self.url,
            "size": self.size,
            "rotation": self.rotation,
            "thumbnailUrl": self.thumbnailUrl
        }


@router.get("/")
async def list_documents(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Liste des documents avec pagination

    Args:
        skip: Nombre de documents à sauter
        limit: Nombre max de documents à retourner

    Returns:
        Liste paginée de documents
    """
    total = db.query(Document).count()
    documents = db.query(Document).offset(skip).limit(limit).all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "documents": [doc.to_dict() for doc in documents]
    }


@router.get("/{document_id}")
async def get_document(
    document_id: int,
    db: Session = Depends(get_db)
):
    """
    Récupère les informations d'un document

    Args:
        document_id: ID du document

    Returns:
        Informations du document
    """
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    return document.to_dict()


@router.get("/{document_id}/pages")
async def get_document_pages(
    document_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Récupère les pages d'un document avec pagination

    Args:
        document_id: ID du document
        page: Numéro de page (commence à 1)
        limit: Nombre de pages par page

    Returns:
        Liste paginée des pages du document
    """
    cache = get_cache()

    # Récupérer le document
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Calculer la pagination
    skip = (page - 1) * limit
    total_pages = document.num_pages
    end_page = min(skip + limit, total_pages)

    # Générer les pages
    pages = []
    for page_num in range(skip + 1, end_page + 1):
        # Vérifier si le thumbnail est en cache
        thumbnail_url = None
        if cache:
            cached_thumb = cache.get_thumbnail(document_id, page_num)
            if cached_thumb:
                thumbnail_url = f"/documents/{document_id}/thumbnails/{page_num}"

        page_info = PageInfo(
            page_number=page_num,
            document_id=document_id,
            document_name=document.original_name,
            file_type=document.file_type,
            url=f"/uploads/{document.filename}",
            size=document.file_size // total_pages
        )

        page_response = PageResponse(page_info, thumbnail_url)
        pages.append(page_response.to_dict())

    return {
        "document_id": document_id,
        "document_name": document.original_name,
        "total_pages": total_pages,
        "current_page": page,
        "limit": limit,
        "pages": pages,
        "has_more": end_page < total_pages
    }


@router.get("/{document_id}/thumbnails/{page_number}")
async def get_page_thumbnail(
    document_id: int,
    page_number: int,
    width: int = Query(150, ge=50, le=500),
    height: int = Query(200, ge=50, le=700),
    db: Session = Depends(get_db)
):
    """
    Récupère le thumbnail d'une page avec cache Redis

    Args:
        document_id: ID du document
        page_number: Numéro de page
        width: Largeur du thumbnail (défaut: 150)
        height: Hauteur du thumbnail (défaut: 200)

    Returns:
        Image thumbnail en base64
    """
    cache = get_cache()

    # Vérifier le cache
    cache_key = f"{document_id}:{page_number}:{width}x{height}"
    if cache:
        cached_thumbnail = cache.get_thumbnail(document_id, page_number)
        if cached_thumbnail:
            logger.debug(f"✅ Thumbnail {document_id}:{page_number} depuis cache Redis")
            return {
                "thumbnail": cached_thumbnail,
                "cached": True
            }

    # Récupérer le document
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if page_number < 1 or page_number > document.num_pages:
        raise HTTPException(status_code=400, detail="Invalid page number")

    # Générer le thumbnail
    try:
        # Pour les PDF, on devrait utiliser pdf2image ou similaire
        # Pour les images, on redimensionne directement
        if document.file_type.startswith("image/"):
            thumbnail_data = generate_image_thumbnail(
                document.file_path,
                width=width,
                height=height
            )
        elif document.file_type == "application/pdf":
            # Pour PDF, il faudrait pdf2image
            # Ici on retourne un placeholder
            thumbnail_data = generate_placeholder_thumbnail(width, height)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")

        # Mettre en cache
        if cache and thumbnail_data:
            cache.set_thumbnail(document_id, page_number, thumbnail_data, ttl=86400)
            logger.info(f"✅ Thumbnail {document_id}:{page_number} mis en cache")

        return {
            "thumbnail": thumbnail_data,
            "cached": False
        }

    except Exception as e:
        logger.error(f"❌ Erreur génération thumbnail: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate thumbnail")


def generate_image_thumbnail(image_path: str, width: int = 150, height: int = 200) -> str:
    """
    Génère un thumbnail à partir d'une image

    Args:
        image_path: Chemin vers l'image
        width: Largeur cible
        height: Hauteur cible

    Returns:
        Image en base64
    """
    try:
        # Ouvrir l'image
        with Image.open(image_path) as img:
            # Redimensionner en gardant le ratio
            img.thumbnail((width, height), Image.Resampling.LANCZOS)

            # Convertir en RGB si nécessaire (pour PNG avec transparence)
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                img = background

            # Sauvegarder en buffer
            buffer = io.BytesIO()
            img.save(buffer, format='JPEG', quality=85, optimize=True)
            buffer.seek(0)

            # Convertir en base64
            thumbnail_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
            return f"data:image/jpeg;base64,{thumbnail_base64}"

    except Exception as e:
        logger.error(f"Erreur génération thumbnail image: {e}")
        raise


def generate_placeholder_thumbnail(width: int = 150, height: int = 200) -> str:
    """
    Génère un thumbnail placeholder

    Args:
        width: Largeur
        height: Hauteur

    Returns:
        Image placeholder en base64
    """
    try:
        # Créer une image grise
        img = Image.new('RGB', (width, height), color=(200, 200, 200))

        # Sauvegarder en buffer
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG', quality=85)
        buffer.seek(0)

        # Convertir en base64
        thumbnail_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        return f"data:image/jpeg;base64,{thumbnail_base64}"

    except Exception as e:
        logger.error(f"Erreur génération placeholder: {e}")
        raise


@router.post("/validate-pdfs")
async def validate_pdf_documents(
    db: Session = Depends(get_db)
):
    """
    Valide tous les documents PDF et retourne les IDs des PDFs corrompus

    Returns:
        Liste des IDs des documents PDF corrompus
    """
    # Récupérer tous les PDFs
    pdf_documents = db.query(Document).filter(
        Document.file_type == "application/pdf"
    ).all()

    corrupted_ids = []
    valid_count = 0

    for doc in pdf_documents:
        try:
            import fitz  # PyMuPDF
            # Essayer d'ouvrir le PDF
            pdf_doc = fitz.open(doc.file_path)
            pdf_doc.close()
            valid_count += 1
        except Exception as e:
            logger.warning(f"PDF corrompu détecté: {doc.original_name} (ID: {doc.id}) - {e}")
            corrupted_ids.append({
                "id": doc.id,
                "filename": doc.original_name,
                "error": str(e)
            })

    return {
        "total_pdfs": len(pdf_documents),
        "valid_pdfs": valid_count,
        "corrupted_pdfs": len(corrupted_ids),
        "corrupted_documents": corrupted_ids
    }


@router.post("/clean-corrupted-pdfs")
async def clean_corrupted_pdf_documents(
    db: Session = Depends(get_db)
):
    """
    Supprime tous les documents PDF corrompus de la base de données

    Returns:
        Nombre de PDFs supprimés
    """
    cache = get_cache()

    # D'abord valider et obtenir les IDs corrompus
    pdf_documents = db.query(Document).filter(
        Document.file_type == "application/pdf"
    ).all()

    deleted_count = 0
    deleted_documents = []

    for doc in pdf_documents:
        try:
            import fitz  # PyMuPDF
            # Essayer d'ouvrir le PDF
            pdf_doc = fitz.open(doc.file_path)
            pdf_doc.close()
        except Exception as e:
            logger.warning(f"Suppression PDF corrompu: {doc.original_name} (ID: {doc.id})")

            # Supprimer le fichier physique
            if os.path.exists(doc.file_path):
                os.remove(doc.file_path)

            # Invalider le cache
            if cache:
                cache.invalidate_document_thumbnails(doc.id)

            # Stocker les infos avant suppression
            deleted_documents.append({
                "id": doc.id,
                "filename": doc.original_name
            })

            # Supprimer de la DB
            db.delete(doc)
            deleted_count += 1

    # Commit les suppressions
    if deleted_count > 0:
        db.commit()
        logger.info(f"✅ {deleted_count} PDF(s) corrompu(s) supprimé(s)")

    return {
        "deleted_count": deleted_count,
        "deleted_documents": deleted_documents
    }


@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    db: Session = Depends(get_db)
):
    """
    Supprime un document et invalide le cache

    Args:
        document_id: ID du document

    Returns:
        Confirmation de suppression
    """
    cache = get_cache()

    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Supprimer le fichier physique
    if os.path.exists(document.file_path):
        os.remove(document.file_path)

    # Supprimer de la DB
    db.delete(document)
    db.commit()

    # Invalider le cache des thumbnails
    if cache:
        cache.invalidate_document_thumbnails(document_id)

    return {"message": "Document deleted", "document_id": document_id}
