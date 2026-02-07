from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.models import ScanProfile
from ..models.schemas import ScanProfileCreate, ScanProfileUpdate, ScanProfileResponse

router = APIRouter(
    prefix="/scan-profiles",
    tags=["Scan Profiles"]
)


# GET tous les profils de scan
@router.get("/", response_model=List[ScanProfileResponse])
def get_scan_profiles(db: Session = Depends(get_db)):
    """Récupérer tous les profils de scan"""
    profiles = db.query(ScanProfile).all()
    return [ScanProfileResponse.from_orm(profile) for profile in profiles]


# GET un profil de scan par ID
@router.get("/{profile_id}", response_model=ScanProfileResponse)
def get_scan_profile(profile_id: int, db: Session = Depends(get_db)):
    """Récupérer un profil de scan par son ID"""
    profile = db.query(ScanProfile).filter(ScanProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profil de scan avec ID {profile_id} non trouvé"
        )
    return ScanProfileResponse.from_orm(profile)


# POST créer un nouveau profil de scan
@router.post("/", response_model=ScanProfileResponse, status_code=status.HTTP_201_CREATED)
def create_scan_profile(profile_data: ScanProfileCreate, db: Session = Depends(get_db)):
    """Créer un nouveau profil de scan"""
    # Vérifier si le libélé existe déjà
    existing_profile = db.query(ScanProfile).filter(ScanProfile.libele == profile_data.libele).first()
    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Un profil avec le nom '{profile_data.libele}' existe déjà"
        )

    # Si c'est le profil par défaut, retirer le défaut aux autres
    if profile_data.default == "1":
        db.query(ScanProfile).filter(ScanProfile.default == "1").update({"default": "0"})

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

    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)

    return ScanProfileResponse.from_orm(new_profile)


# PUT mettre à jour un profil de scan
@router.put("/{profile_id}", response_model=ScanProfileResponse)
def update_scan_profile(
    profile_id: int,
    profile_data: ScanProfileUpdate,
    db: Session = Depends(get_db)
):
    """Mettre à jour un profil de scan"""
    profile = db.query(ScanProfile).filter(ScanProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profil de scan avec ID {profile_id} non trouvé"
        )

    # Vérifier si le nouveau libélé existe déjà (si on change le nom)
    if profile_data.libele and profile_data.libele != profile.libele:
        existing_profile = db.query(ScanProfile).filter(ScanProfile.libele == profile_data.libele).first()
        if existing_profile:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Un profil avec le nom '{profile_data.libele}' existe déjà"
            )

    # Si c'est le nouveau profil par défaut, retirer le défaut aux autres
    if profile_data.default and profile_data.default == "1":
        db.query(ScanProfile).filter(ScanProfile.default == "1", ScanProfile.id != profile_id).update({"default": "0"})

    # Mettre à jour les champs
    update_data = profile_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        # Convertir les Enum en string
        if hasattr(value, 'value'):
            value = value.value
        setattr(profile, key, value)

    db.commit()
    db.refresh(profile)

    return ScanProfileResponse.from_orm(profile)


# DELETE supprimer un profil de scan
@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_scan_profile(profile_id: int, db: Session = Depends(get_db)):
    """Supprimer un profil de scan"""
    profile = db.query(ScanProfile).filter(ScanProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profil de scan avec ID {profile_id} non trouvé"
        )

    db.delete(profile)
    db.commit()

    return None
