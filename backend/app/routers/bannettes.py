from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone

from ..models.mongo_models import BannetteModel, User
from ..models.schemas import BannetteCreate, BannetteResponse
from .auth import get_current_user_active

router = APIRouter(
    prefix="/bannettes",
    tags=["Bannettes"]
)

def _bannette_to_response(bannette: BannetteModel) -> BannetteResponse:
    """Convertit un modèle BannetteModel en BannetteResponse"""
    return BannetteResponse(
        id=str(bannette.id),
        name=bannette.name,
        description=bannette.description,
        pages_order=bannette.pages_order,
        classified_pages=bannette.classified_pages,
        total_pages=bannette.total_pages,
        created_at=bannette.created_at,
        updated_at=bannette.updated_at
    )

@router.get("/", response_model=List[BannetteResponse])
async def list_bannettes(
    current_user: User = Depends(get_current_user_active)
):
    """Liste toutes les bannettes de l'utilisateur"""
    bannettes = await BannetteModel.find(
        BannetteModel.user_id == str(current_user.id)
    ).sort("-updated_at").to_list()
    
    return [_bannette_to_response(b) for b in bannettes]

@router.post("/", response_model=BannetteResponse)
async def create_bannette(
    data: BannetteCreate,
    current_user: User = Depends(get_current_user_active)
):
    """Crée une nouvelle bannette"""
    bannette = BannetteModel(
        user_id=str(current_user.id),
        name=data.name,
        description=data.description,
        pages_order=data.pages_order,
        classified_pages=data.classified_pages,
        total_pages=data.total_pages
    )
    await bannette.insert()
    return _bannette_to_response(bannette)

@router.get("/{bannette_id}", response_model=BannetteResponse)
async def get_bannette(
    bannette_id: str,
    current_user: User = Depends(get_current_user_active)
):
    """Récupère les détails d'une bannette"""
    bannette = await BannetteModel.get(bannette_id)
    if not bannette or bannette.user_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Bannette non trouvée")
    
    return _bannette_to_response(bannette)

@router.put("/{bannette_id}", response_model=BannetteResponse)
async def update_bannette(
    bannette_id: str,
    data: BannetteCreate,
    current_user: User = Depends(get_current_user_active)
):
    """Met à jour une bannette existante"""
    bannette = await BannetteModel.get(bannette_id)
    if not bannette or bannette.user_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Bannette non trouvée")
    
    # Mise à jour des champs
    bannette.name = data.name
    bannette.description = data.description
    bannette.pages_order = data.pages_order
    bannette.classified_pages = data.classified_pages
    bannette.total_pages = data.total_pages
    bannette.updated_at = datetime.now(timezone.utc)
    
    await bannette.save()
    return _bannette_to_response(bannette)

@router.delete("/{bannette_id}")
async def delete_bannette(
    bannette_id: str,
    current_user: User = Depends(get_current_user_active)
):
    """Supprime une bannette"""
    bannette = await BannetteModel.get(bannette_id)
    if not bannette or bannette.user_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Bannette non trouvée")
    
    await bannette.delete()
    return {"message": "Bannette supprimée avec succès"}
