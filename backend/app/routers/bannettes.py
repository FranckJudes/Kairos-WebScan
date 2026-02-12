"""
API pour la gestion des bannettes (sauvegarde d'état)
"""
from fastapi import APIRouter, HTTPException, Depends, Body
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from ..database import get_db
from ..models.classification import Bannette

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/bannettes", tags=["Bannettes"])


@router.get("/")
async def list_bannettes(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Liste toutes les bannettes

    Returns:
        Liste des bannettes avec pagination
    """
    total = db.query(Bannette).count()
    bannettes = db.query(Bannette).order_by(Bannette.updated_at.desc()).offset(skip).limit(limit).all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "bannettes": [b.to_dict() for b in bannettes]
    }


@router.get("/{bannette_id}")
async def get_bannette(
    bannette_id: int,
    db: Session = Depends(get_db)
):
    """
    Récupère une bannette par ID

    Returns:
        Détails de la bannette
    """
    bannette = db.query(Bannette).filter(Bannette.id == bannette_id).first()
    if not bannette:
        raise HTTPException(status_code=404, detail="Bannette not found")

    return bannette.to_dict()


@router.post("/")
async def create_bannette(
    data: dict = Body(...),
    db: Session = Depends(get_db)
):
    """
    Crée une nouvelle bannette

    Body:
        name: Nom de la bannette
        description: Description (optionnel)
        pages_order: Liste des pages ordonnées
        classified_pages: Pages classées
        total_pages: Nombre total de pages

    Returns:
        Bannette créée
    """
    try:
        bannette = Bannette(
            name=data.get("name", "Sans nom"),
            description=data.get("description"),
            pages_order=data.get("pages_order", []),
            classified_pages=data.get("classified_pages", {}),
            total_pages=data.get("total_pages", 0)
        )

        db.add(bannette)
        db.commit()
        db.refresh(bannette)

        logger.info(f"✅ Bannette créée: {bannette.id} - {bannette.name}")
        return bannette.to_dict()

    except Exception as e:
        logger.error(f"❌ Erreur création bannette: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{bannette_id}")
async def update_bannette(
    bannette_id: int,
    data: dict = Body(...),
    db: Session = Depends(get_db)
):
    """
    Met à jour une bannette

    Returns:
        Bannette mise à jour
    """
    bannette = db.query(Bannette).filter(Bannette.id == bannette_id).first()
    if not bannette:
        raise HTTPException(status_code=404, detail="Bannette not found")

    try:
        if "name" in data:
            bannette.name = data["name"]
        if "description" in data:
            bannette.description = data["description"]
        if "pages_order" in data:
            bannette.pages_order = data["pages_order"]
        if "classified_pages" in data:
            bannette.classified_pages = data["classified_pages"]
        if "total_pages" in data:
            bannette.total_pages = data["total_pages"]

        db.commit()
        db.refresh(bannette)

        logger.info(f"✅ Bannette mise à jour: {bannette.id}")
        return bannette.to_dict()

    except Exception as e:
        logger.error(f"❌ Erreur mise à jour bannette: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{bannette_id}")
async def delete_bannette(
    bannette_id: int,
    db: Session = Depends(get_db)
):
    """
    Supprime une bannette

    Returns:
        Confirmation de suppression
    """
    bannette = db.query(Bannette).filter(Bannette.id == bannette_id).first()
    if not bannette:
        raise HTTPException(status_code=404, detail="Bannette not found")

    try:
        db.delete(bannette)
        db.commit()

        logger.info(f"✅ Bannette supprimée: {bannette_id}")
        return {"message": "Bannette deleted", "bannette_id": bannette_id}

    except Exception as e:
        logger.error(f"❌ Erreur suppression bannette: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
