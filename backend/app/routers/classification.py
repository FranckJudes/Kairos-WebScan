"""
API de classification des pages avec persistance et WebSocket
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
import logging

from ..database import get_db
from ..models.typology import DocumentType
from ..models.classification import PageClassification
from ..websocket import get_manager
from ..cache import get_cache
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/classification", tags=["Classification"])


class ClassifyPagesRequest(BaseModel):
    """Requête pour classer des pages dans une typologie"""
    document_id: int
    pages: List[int]  # Liste des numéros de page
    type_id: int  # ID du type de document


class ReinsertPagesRequest(BaseModel):
    """Requête pour réinsérer des pages classées"""
    document_id: int
    pages: List[int]  # Liste des numéros de page à réinsérer


class ClassifyPagesResponse(BaseModel):
    """Réponse après classification"""
    success: bool
    message: str
    classified_pages: List[int]
    type_id: int
    type_name: str


class ReinsertPagesResponse(BaseModel):
    """Réponse après réinsertion"""
    success: bool
    message: str
    reinserted_pages: List[int]


@router.post("/classify", response_model=ClassifyPagesResponse)
async def classify_pages(
    request: ClassifyPagesRequest,
    db: Session = Depends(get_db)
):
    """
    Classe des pages dans un type de document de la typologie
    Persiste en base de données et notifie via WebSocket

    Args:
        request: Contient document_id, pages (liste), et type_id

    Returns:
        Confirmation des pages classées avec le type de document
    """
    manager = get_manager()
    cache = get_cache()

    # Vérifier que le type de document existe
    doc_type = db.query(DocumentType).filter(
        DocumentType.id == request.type_id,
        DocumentType.is_active == True
    ).first()

    if not doc_type:
        raise HTTPException(status_code=404, detail="Document type not found or inactive")

    # Compter les classifications existantes pour générer le nom de l'instance
    existing_count = db.query(PageClassification).filter(
        PageClassification.type_id == request.type_id
    ).count()

    instance_number = existing_count + 1
    instance_name = f"{doc_type.name}" if instance_number == 1 else f"{doc_type.name} ({instance_number})"

    # Créer les classifications en base
    for page_num in request.pages:
        classification = PageClassification(
            document_id=request.document_id,
            page_number=page_num,
            type_id=request.type_id,
            instance_name=instance_name
        )
        db.add(classification)

    db.commit()

    # Invalider le cache de typologie si nécessaire
    if cache:
        cache.invalidate_typology()

    # Notifier via WebSocket
    await manager.notify_pages_classified({
        "document_id": request.document_id,
        "pages": request.pages,
        "type_id": request.type_id,
        "type_name": doc_type.name,
        "instance_name": instance_name
    })

    logger.info(f"✅ {len(request.pages)} page(s) classée(s) dans {doc_type.name}")

    return ClassifyPagesResponse(
        success=True,
        message=f"{len(request.pages)} page(s) classée(s) dans {doc_type.name}",
        classified_pages=request.pages,
        type_id=request.type_id,
        type_name=doc_type.name
    )


@router.post("/reinsert", response_model=ReinsertPagesResponse)
async def reinsert_pages(
    request: ReinsertPagesRequest,
    db: Session = Depends(get_db)
):
    """
    Réinsère des pages classées dans le pool de pages non classées
    Supprime de la base de données et notifie via WebSocket

    Args:
        request: Contient document_id et pages (liste)

    Returns:
        Confirmation des pages réinsérées
    """
    manager = get_manager()
    cache = get_cache()

    # Supprimer les classifications
    deleted = db.query(PageClassification).filter(
        PageClassification.document_id == request.document_id,
        PageClassification.page_number.in_(request.pages)
    ).delete(synchronize_session='fetch')

    db.commit()

    # Invalider le cache
    if cache:
        cache.invalidate_typology()

    # Notifier via WebSocket
    await manager.notify_pages_reinserted({
        "document_id": request.document_id,
        "pages": request.pages
    })

    logger.info(f"✅ {deleted} page(s) réinsérée(s)")

    return ReinsertPagesResponse(
        success=True,
        message=f"{deleted} page(s) réinsérée(s)",
        reinserted_pages=request.pages
    )


@router.delete("/instances/{instance_id}")
async def delete_instance(
    instance_id: int,
    db: Session = Depends(get_db)
):
    """
    Supprime une instance de classification spécifique
    Notifie via WebSocket

    Args:
        instance_id: ID de l'instance de classification

    Returns:
        Confirmation de la suppression
    """
    manager = get_manager()
    cache = get_cache()

    # Trouver l'instance
    instance = db.query(PageClassification).filter(
        PageClassification.id == instance_id
    ).first()

    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")

    document_id = instance.document_id
    page_num = instance.page_number

    # Supprimer
    db.delete(instance)
    db.commit()

    # Invalider le cache
    if cache:
        cache.invalidate_typology()

    # Notifier via WebSocket
    await manager.notify_instance_deleted({
        "instance_id": instance_id,
        "document_id": document_id,
        "page_num": page_num
    })

    logger.info(f"✅ Instance {instance_id} supprimée")

    return {
        "success": True,
        "message": "Instance supprimée",
        "instance_id": instance_id
    }


@router.get("/instances/{document_id}")
async def get_document_instances(
    document_id: int,
    db: Session = Depends(get_db)
):
    """
    Récupère toutes les instances de classification pour un document

    Args:
        document_id: ID du document

    Returns:
        Liste des instances de classification
    """
    classifications = db.query(PageClassification).filter(
        PageClassification.document_id == document_id
    ).all()

    # Grouper par type
    grouped = {}
    for classif in classifications:
        type_id = classif.type_id
        if type_id not in grouped:
            doc_type = db.query(DocumentType).filter(DocumentType.id == type_id).first()
            grouped[type_id] = {
                "type_id": type_id,
                "type_name": doc_type.name if doc_type else "Unknown",
                "instances": []
            }

        grouped[type_id]["instances"].append({
            "id": classif.id,
            "page_number": classif.page_number,
            "instance_name": classif.instance_name,
            "created_at": classif.created_at.isoformat() if classif.created_at else None
        })

    return {
        "document_id": document_id,
        "classifications": list(grouped.values())
    }


@router.get("/pages/{document_id}")
async def get_document_classified_pages(
    document_id: int,
    db: Session = Depends(get_db)
):
    """
    Récupère les pages classées et non classées d'un document

    Args:
        document_id: ID du document

    Returns:
        Dictionnaire avec les pages classées par type et les pages non classées
    """
    # Récupérer toutes les classifications du document
    classifications = db.query(PageClassification).filter(
        PageClassification.document_id == document_id
    ).all()

    # Grouper par type
    classified = {}
    classified_page_nums = set()

    for classif in classifications:
        type_id = classif.type_id
        classified_page_nums.add(classif.page_number)

        # Récupérer les infos du type
        doc_type = db.query(DocumentType).filter(DocumentType.id == type_id).first()

        if type_id not in classified:
            classified[type_id] = {
                "type_name": doc_type.name if doc_type else "Unknown",
                "pages": []
            }

        classified[type_id]["pages"].append(classif.page_number)

    # Pages non classées (pour l'instant, on suppose qu'on connaît le total)
    # TODO: Récupérer le nombre total de pages depuis la table documents
    unclassified = []  # Sera calculé côté frontend

    return {
        "document_id": document_id,
        "classified": classified,
        "unclassified": unclassified
    }


@router.post("/batch/classify")
async def batch_classify_pages(
    classifications: List[ClassifyPagesRequest],
    db: Session = Depends(get_db)
):
    """
    Classification en lot de plusieurs pages

    Args:
        classifications: Liste des requêtes de classification

    Returns:
        Résumé des opérations effectuées
    """
    manager = get_manager()
    cache = get_cache()
    results = []
    total_pages = 0

    for request in classifications:
        # Vérifier que le type de document existe
        doc_type = db.query(DocumentType).filter(
            DocumentType.id == request.type_id,
            DocumentType.is_active == True
        ).first()

        if not doc_type:
            results.append({
                "document_id": request.document_id,
                "success": False,
                "error": "Document type not found"
            })
            continue

        # Créer les classifications
        for page_num in request.pages:
            classification = PageClassification(
                document_id=request.document_id,
                page_number=page_num,
                type_id=request.type_id,
                instance_name=doc_type.name
            )
            db.add(classification)

        total_pages += len(request.pages)

        results.append({
            "document_id": request.document_id,
            "success": True,
            "pages": request.pages,
            "type_name": doc_type.name
        })

    db.commit()

    # Invalider le cache
    if cache:
        cache.invalidate_typology()

    # Notifier via WebSocket
    await manager.notify_batch_update({
        "operation": "batch_classify",
        "affected_items": results,
        "total_pages": total_pages
    })

    logger.info(f"✅ {total_pages} page(s) classée(s) dans {len(classifications)} document(s)")

    return {
        "success": True,
        "message": f"{total_pages} page(s) traitée(s) dans {len(classifications)} document(s)",
        "results": results
    }
