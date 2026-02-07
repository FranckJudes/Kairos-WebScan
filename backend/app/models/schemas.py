from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class BlankPageEnum(str, Enum):
    no = "0"
    yes = "1"


class DefaultEnum(str, Enum):
    no = "0"
    yes = "1"


# Schema pour créer un profil de scan
class ScanProfileCreate(BaseModel):
    libele: str = Field(..., max_length=255, description="Nom du profil de scan")
    paper_size: str = Field(default="A4", description="Format papier (A4, A3, Letter, Legal)")
    horizontal_align: str = Field(default="center", description="Alignement horizontal (left, center, right)")
    resolution: int = Field(default=150, ge=75, le=1200, description="Résolution en DPI")
    scale: str = Field(default="100%", description="Échelle du scan (50%, 75%, 100%, 125%, 150%, 200%)")
    brightness: int = Field(default=50, ge=0, le=100, description="Luminosité (0-100)")
    contrast: int = Field(default=50, ge=0, le=100, description="Contraste (0-100)")
    blank_page: BlankPageEnum = Field(default=BlankPageEnum.no, description="Détection pages vides")
    sensibility: Optional[str] = Field(default=None, description="Sensibilité de détection")
    default: DefaultEnum = Field(default=DefaultEnum.no, description="Profil par défaut")


# Schema pour mettre à jour un profil de scan
class ScanProfileUpdate(BaseModel):
    libele: Optional[str] = Field(None, max_length=255)
    paper_size: Optional[str] = None
    horizontal_align: Optional[str] = None
    resolution: Optional[int] = Field(None, ge=75, le=1200)
    scale: Optional[str] = None
    brightness: Optional[int] = Field(None, ge=0, le=100)
    contrast: Optional[int] = Field(None, ge=0, le=100)
    blank_page: Optional[BlankPageEnum] = None
    sensibility: Optional[str] = None
    default: Optional[DefaultEnum] = None


# Schema pour la réponse API (avec tous les champs)
class ScanProfileResponse(ScanProfileCreate):
    id: int
    brithness: Optional[int] = None  # Pour compatibilité avec l'ancien nom

    class Config:
        from_attributes = True

    @classmethod
    def from_orm(cls, obj):
        # Convertir l'objet SQLAlchemy en dictionnaire
        data = {
            "id": obj.id,
            "libele": obj.libele,
            "paper_size": obj.paper_size,
            "horizontal_align": obj.horizontal_align,
            "resolution": obj.resolution,
            "scale": obj.scale,
            "brightness": obj.brightness,
            "contrast": obj.contrast,
            "blank_page": obj.blank_page,
            "sensibility": obj.sensibility,
            "default": obj.default,
            "brithness": obj.brightness,  # Pour compatibilité avec le frontend qui utilise 'brithness'
        }
        return cls(**data)
