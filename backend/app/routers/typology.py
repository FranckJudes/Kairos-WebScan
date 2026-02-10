from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.typology import DocumentType, INITIAL_TYPOLOGY
from ..cache import get_cache
from ..websocket import get_manager
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/typology", tags=["Typology"])


class DocumentTypeCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    icon: str = "folder"
    parent_id: Optional[int] = None
    order: int = 0


class DocumentTypeResponse(BaseModel):
    id: int
    name: str
    code: str
    description: Optional[str]
    icon: str
    parent_id: Optional[int]
    order: int
    is_active: bool

    class Config:
        from_attributes = True


@router.get("/tree", response_model=List[DocumentTypeResponse])
def get_typology_tree(db: Session = Depends(get_db)):
    """
    Récupère toute la typologie sous forme d'arbre plat
    (format compatible jstree avec id et parent)

    Les résultats sont mis en cache pendant 1 heure.
    """
    cache = get_cache()

    # Essayer de récupérer depuis le cache
    if cache:
        cached_data = cache.get_typology_tree()
        if cached_data is not None:
            return cached_data

    # Si pas en cache, requêter la base de données
    types = db.query(DocumentType).filter(DocumentType.is_active == True).order_by(DocumentType.order).all()

    # Convertir en dict pour le cache
    types_data = [
        {
            "id": t.id,
            "name": t.name,
            "code": t.code,
            "description": t.description,
            "icon": t.icon,
            "parent_id": t.parent_id,
            "order": t.order,
            "is_active": t.is_active
        }
        for t in types
    ]

    # Mettre en cache
    if cache:
        cache.set_typology_tree(types_data, ttl=3600)

    return types


@router.get("/initialize")
def initialize_typology(db: Session = Depends(get_db)):
    """
    Initialise la typologie avec les données par défaut
    À appeler au démarrage de l'application
    """
    cache = get_cache()
    manager = get_manager()

    # Vérifier si la typologie existe déjà
    existing = db.query(DocumentType).first()
    if existing:
        return {"message": "Typology already initialized", "count": db.query(DocumentType).count()}

    # Créer la typologie initiale
    for type_data in INITIAL_TYPOLOGY:
        doc_type = DocumentType(**type_data)
        db.add(doc_type)

    db.commit()

    # Invalider le cache et notifier via WebSocket
    if cache:
        cache.invalidate_typology()

    # Note: On ne notifie pas via WebSocket ici car c'est l'initialisation

    return {"message": "Typology initialized", "count": len(INITIAL_TYPOLOGY)}


@router.post("/", response_model=DocumentTypeResponse)
async def create_document_type(type_data: DocumentTypeCreate, db: Session = Depends(get_db)):
    """Crée un nouveau type de document"""
    cache = get_cache()
    manager = get_manager()

    db_type = DocumentType(**type_data.model_dump())
    db.add(db_type)
    db.commit()
    db.refresh(db_type)

    # Invalider le cache et notifier via WebSocket
    if cache:
        cache.invalidate_typology()

    await manager.notify_typology_updated({
        "action": "created",
        "type_id": db_type.id,
        "type_name": db_type.name,
        "type_data": {
            "id": db_type.id,
            "name": db_type.name,
            "code": db_type.code,
            "description": db_type.description,
            "icon": db_type.icon,
            "parent_id": db_type.parent_id,
            "order": db_type.order,
            "is_active": db_type.is_active
        }
    })

    return db_type


@router.put("/{type_id}", response_model=DocumentTypeResponse)
async def update_document_type(type_id: int, type_data: DocumentTypeCreate, db: Session = Depends(get_db)):
    """Met à jour un type de document"""
    cache = get_cache()
    manager = get_manager()

    db_type = db.query(DocumentType).filter(DocumentType.id == type_id).first()
    if not db_type:
        raise HTTPException(status_code=404, detail="Document type not found")

    for field, value in type_data.model_dump(exclude_unset=True).items():
        setattr(db_type, field, value)

    db.commit()
    db.refresh(db_type)

    # Invalider le cache et notifier via WebSocket
    if cache:
        cache.invalidate_typology()

    await manager.notify_typology_updated({
        "action": "updated",
        "type_id": db_type.id,
        "type_name": db_type.name,
        "type_data": {
            "id": db_type.id,
            "name": db_type.name,
            "code": db_type.code,
            "description": db_type.description,
            "icon": db_type.icon,
            "parent_id": db_type.parent_id,
            "order": db_type.order,
            "is_active": db_type.is_active
        }
    })

    return db_type


@router.delete("/{type_id}")
async def delete_document_type(type_id: int, db: Session = Depends(get_db)):
    """Supprime (désactive) un type de document"""
    cache = get_cache()
    manager = get_manager()

    db_type = db.query(DocumentType).filter(DocumentType.id == type_id).first()
    if not db_type:
        raise HTTPException(status_code=404, detail="Document type not found")

    type_name = db_type.name

    db_type.is_active = False
    db.commit()

    # Invalider le cache et notifier via WebSocket
    if cache:
        cache.invalidate_typology()

    await manager.notify_typology_updated({
        "action": "deleted",
        "type_id": type_id,
        "type_name": type_name
    })

    return {"message": "Document type deleted"}
