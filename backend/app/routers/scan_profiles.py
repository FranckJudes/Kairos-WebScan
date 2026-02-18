from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime, timezone

from ..models.mongo_models import ScanProfile
from ..models.schemas import ScanProfileCreate, ScanProfileUpdate, ScanProfileResponse

router = APIRouter(
    prefix="/scan-profiles",
    tags=["Scan Profiles"]
)


# GET tous les profils de scan
@router.get("/", response_model=List[ScanProfileResponse])
async def get_scan_profiles():
    """Récupérer tous les profils de scan"""
    profiles = await ScanProfile.find_all().to_list()
    return [_profile_to_response(profile) for profile in profiles]


# GET un profil de scan par ID
@router.get("/{profile_id}", response_model=ScanProfileResponse)
async def get_scan_profile(profile_id: str):
    """Récupérer un profil de scan par son ID"""
    profile = await ScanProfile.get(profile_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profil de scan avec ID {profile_id} non trouvé"
        )
    return _profile_to_response(profile)


# POST créer un nouveau profil de scan
@router.post("/", response_model=ScanProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_scan_profile(profile_data: ScanProfileCreate):
    """Créer un nouveau profil de scan"""
    # Vérifier si le libélé existe déjà
    existing_profile = await ScanProfile.find_one(ScanProfile.libele == profile_data.libele)
    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Un profil avec le nom '{profile_data.libele}' existe déjà"
        )

    # Si c'est le profil par défaut, retirer le défaut aux autres
    if profile_data.default == "1":
        await ScanProfile.find_many(ScanProfile.default == "1").update({"$set": {"default": "0"}})

    # Créer le nouveau profil
    new_profile = ScanProfile(
        libele=profile_data.libele,
        paper_size=profile_data.paper_size,
        horizontal_align=profile_data.horizontal_align,
        resolution=profile_data.resolution,
        scale=profile_data.scale,
        brightness=profile_data.brightness,
        contrast=profile_data.contrast,
        blank_page=profile_data.blank_page.value,
        sensibility=profile_data.sensibility,
        default=profile_data.default.value
    )

    await new_profile.insert()
    return _profile_to_response(new_profile)


# PUT mettre à jour un profil de scan
@router.put("/{profile_id}", response_model=ScanProfileResponse)
async def update_scan_profile(
    profile_id: str,
    profile_data: ScanProfileUpdate
):
    """Mettre à jour un profil de scan"""
    profile = await ScanProfile.get(profile_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profil de scan avec ID {profile_id} non trouvé"
        )

    # Vérifier si le nouveau libélé existe déjà (si on change le nom)
    if profile_data.libele and profile_data.libele != profile.libele:
        existing_profile = await ScanProfile.find_one(ScanProfile.libele == profile_data.libele)
        if existing_profile:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Un profil avec le nom '{profile_data.libele}' existe déjà"
            )

    # Si c'est le nouveau profil par défaut, retirer le défaut aux autres
    if profile_data.default and profile_data.default == "1":
        await ScanProfile.find_many({
            ScanProfile.default == "1",
            ScanProfile.id != profile_id
        }).update({"$set": {"default": "0"}})

    # Mettre à jour les champs
    update_data = profile_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        # Convertir les Enum en string
        if hasattr(value, 'value'):
            value = value.value
        setattr(profile, key, value)

    profile.updated_at = datetime.now(timezone.utc)
    await profile.save()

    return _profile_to_response(profile)


# DELETE supprimer un profil de scan
@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scan_profile(profile_id: str):
    """Supprimer un profil de scan"""
    profile = await ScanProfile.get(profile_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profil de scan avec ID {profile_id} non trouvé"
        )

    await profile.delete()
    return None


def _profile_to_response(profile: ScanProfile) -> ScanProfileResponse:
    """Convertit un modèle ScanProfile en Response"""
    return ScanProfileResponse(
        id=str(profile.id),
        libele=profile.libele,
        paper_size=profile.paper_size,
        horizontal_align=profile.horizontal_align,
        resolution=profile.resolution,
        scale=profile.scale,
        brightness=profile.brightness,
        brithness=profile.brightness,
        contrast=profile.contrast,
        blank_page=profile.blank_page,
        sensibility=profile.sensibility,
        default=profile.default
    )
