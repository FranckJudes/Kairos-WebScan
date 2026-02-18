from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel

from ..models.typology_mongo import DocumentType, INITIAL_TYPOLOGY
from ..cache import get_cache
from ..websocket import get_manager

router = APIRouter(prefix="/typology", tags=["Typology"])


class DocumentTypeCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    icon: str = "folder"
    parent_id: Optional[str] = None  # MongoDB ObjectId
    order: int = 0


class DocumentTypeResponse(BaseModel):
    id: str
    name: str
    code: str
    description: Optional[str]
    icon: str
    parent_id: Optional[str]
    order: int
    is_active: bool


@router.get("/tree", response_model=List[DocumentTypeResponse])
async def get_typology_tree():
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
    types = await DocumentType.find(DocumentType.is_active == True).sort(DocumentType.order).to_list()

    # Convertir en dict pour le cache
    types_data = [
        {
            "id": str(t.id),
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
async def initialize_typology():
    """
    Initialise la typologie avec les données par défaut
    À appeler au démarrage de l'application
    """
    cache = get_cache()
    manager = get_manager()

    # Vérifier si la typologie existe déjà
    existing_count = await DocumentType.count()
    if existing_count > 0:
        return {"message": "Typology already initialized", "count": existing_count}

    # Créer la typologie initiale
    # D'abord créer les parents (sans parent_id)
    created_types = {}

    for type_data in INITIAL_TYPOLOGY:
        if type_data["parent_id"] is None:
            doc_type = DocumentType(**type_data)
            await doc_type.insert()
            created_types[type_data["code"]] = doc_type

    # Ensuite créer les enfants et mettre à jour les parent_id
    for type_data in INITIAL_TYPOLOGY:
        if type_data["parent_id"] is not None:
            # Trouver le parent par code
            parent_code = None
            for parent_data in INITIAL_TYPOLOGY:
                if parent_data["order"] == type_data["order"] and parent_data["parent_id"] is None:
                    # Trouver le bon parent selon le contexte
                    if type_data["code"] in ["CIN", "PASSPORT", "DRIVER_LICENSE"]:
                        parent_code = "IDENTITY"
                    elif type_data["code"] in ["ELEC_INVOICE", "WATER_INVOICE", "TEL_INVOICE"]:
                        parent_code = "INVOICES"
                    elif type_data["code"] == "INVOICES":
                        parent_code = "FINANCIAL"
                    elif type_data["code"] == "BANK_STATEMENTS":
                        parent_code = "FINANCIAL"
                    elif type_data["code"] in ["RENTAL_CONTRACT", "EMPLOYMENT_CONTRACT"]:
                        parent_code = "CONTRACTS"
                    elif type_data["code"] == "CONTRACTS":
                        parent_code = "LEGAL"
                    elif type_data["code"] in ["PRESCRIPTIONS", "LAB_RESULTS"]:
                        parent_code = "MEDICAL"
                    break

            if parent_code and parent_code in created_types:
                type_data["parent_id"] = str(created_types[parent_code].id)

            doc_type = DocumentType(**type_data)
            await doc_type.insert()

    # Invalider le cache et notifier via WebSocket
    if cache:
        cache.invalidate_typology()

    return {"message": "Typology initialized", "count": len(INITIAL_TYPOLOGY)}


@router.post("/", response_model=DocumentTypeResponse)
async def create_document_type(type_data: DocumentTypeCreate):
    """Crée un nouveau type de document"""
    cache = get_cache()
    manager = get_manager()

    new_type = DocumentType(**type_data.model_dump())
    await new_type.insert()

    # Invalider le cache et notifier via WebSocket
    if cache:
        cache.invalidate_typology()

    await manager.notify_typology_updated({
        "action": "created",
        "type_id": str(new_type.id),
        "type_name": new_type.name,
        "type_data": {
            "id": str(new_type.id),
            "name": new_type.name,
            "code": new_type.code,
            "description": new_type.description,
            "icon": new_type.icon,
            "parent_id": new_type.parent_id,
            "order": new_type.order,
            "is_active": new_type.is_active
        }
    })

    return DocumentTypeResponse(
        id=str(new_type.id),
        name=new_type.name,
        code=new_type.code,
        description=new_type.description,
        icon=new_type.icon,
        parent_id=new_type.parent_id,
        order=new_type.order,
        is_active=new_type.is_active
    )


@router.put("/{type_id}", response_model=DocumentTypeResponse)
async def update_document_type(type_id: str, type_data: DocumentTypeCreate):
    """Met à jour un type de document"""
    cache = get_cache()
    manager = get_manager()

    doc_type = await DocumentType.get(type_id)
    if not doc_type:
        raise HTTPException(status_code=404, detail="Document type not found")

    for field, value in type_data.model_dump(exclude_unset=True).items():
        setattr(doc_type, field, value)

    await doc_type.save()

    # Invalider le cache et notifier via WebSocket
    if cache:
        cache.invalidate_typology()

    await manager.notify_typology_updated({
        "action": "updated",
        "type_id": type_id,
        "type_name": doc_type.name,
        "type_data": {
            "id": str(doc_type.id),
            "name": doc_type.name,
            "code": doc_type.code,
            "description": doc_type.description,
            "icon": doc_type.icon,
            "parent_id": doc_type.parent_id,
            "order": doc_type.order,
            "is_active": doc_type.is_active
        }
    })

    return DocumentTypeResponse(
        id=str(doc_type.id),
        name=doc_type.name,
        code=doc_type.code,
        description=doc_type.description,
        icon=doc_type.icon,
        parent_id=doc_type.parent_id,
        order=doc_type.order,
        is_active=doc_type.is_active
    )


@router.delete("/{type_id}")
async def delete_document_type(type_id: str):
    """Supprime (désactive) un type de document"""
    cache = get_cache()
    manager = get_manager()

    doc_type = await DocumentType.get(type_id)
    if not doc_type:
        raise HTTPException(status_code=404, detail="Document type not found")

    type_name = doc_type.name

    doc_type.is_active = False
    await doc_type.save()

    # Invalider le cache et notifier via WebSocket
    if cache:
        cache.invalidate_typology()

    await manager.notify_typology_updated({
        "action": "deleted",
        "type_id": type_id,
        "type_name": type_name
    })

    return {"message": "Document type deleted"}
