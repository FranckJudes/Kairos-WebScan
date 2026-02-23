"""
Modèles MongoDB pour Kairos WebScan avec Beanie ODM
"""
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from enum import Enum
from beanie import Document, Indexed
from pydantic import Field, EmailStr



class UserStatusEnum(str, Enum):
    """Statuts possibles d'un utilisateur"""
    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    DELETED = "deleted"


class LicenseTypeEnum(str, Enum):
    """Types de licences disponibles"""
    FREE = "free"
    BASIC = "basic"
    PRO = "pro"
    ENTERPRISE = "enterprise"



class License(Document):
    """
    Modèle de licence utilisateur avec gestion des quotas
    """
    user_id: Optional[int] = None  

    license_type: LicenseTypeEnum = LicenseTypeEnum.FREE

    scans_per_month: int = 10
    scans_used_this_month: int = 0

    documents_storage_mb: int = 100
    documents_used_storage_mb: float = 0.0

    expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    ocre_available: bool = False
    cloud_storage_available: bool = False
    api_access_available: bool = False
    priority_support_available: bool = False
    advanced_filters_available: bool = False
    batch_processing_available: bool = False

    class Settings:
        name = "licenses"
        indexes = [
            "user_id",
            "license_type",
            "expires_at",
        ]

    async def increment_scans(self) -> None:
        """Incrémente le compteur de scans utilisés ce mois"""
        self.scans_used_this_month += 1
        self.updated_at = datetime.utcnow()
        await self.save()

    async def reset_monthly_scans(self) -> None:
        """Réinitialise le compteur de scans mensuel"""
        self.scans_used_this_month = 0
        self.updated_at = datetime.utcnow()
        await self.save()

    async def can_scan(self) -> bool:
        """Vérifie si l'utilisateur peut encore scanner ce mois-ci"""
        return self.scans_used_this_month < self.scans_per_month

    async def has_storage(self, size_mb: float) -> bool:
        """Vérifie si l'utilisateur a assez de stockage"""
        return (self.documents_used_storage_mb + size_mb) <= self.documents_storage_mb


class RecentDocument(Document):
    """
    Modèle pour suivre les documents récents d'un utilisateur
    """
    user_id: str  

    document_id: str 
    document_name: str
    document_type: str

    accessed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "recent_documents"
        indexes = [
            "user_id",
            "accessed_at",
        ]
        ordering = ["-accessed_at"]


class DocumentModel(Document):
    """
    Modèle pour les documents uploadés
    """
    user_id: str  
    filename: Indexed(str)
    original_name: str
    mime_type: str
    size_bytes: int
    storage_path: str
    
    document_type: str = "OTHERS"  # Code de la typologie
    status: str = "PROCESSED"  # PROCESSED, ERROR, PENDING
    
    # Dates
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "documents"
        indexes = [
            "user_id",
            "document_type",
            "created_at",
        ]

class BannetteModel(Document):
    """
    Modèle pour les bannettes (sessions de classification sauvegardées)
    """
    user_id: Indexed(str)
    name: Indexed(str)
    description: Optional[str] = None
    
    pages_order: List[Dict[str, Any]] = []  # Liste des pages (objets) ordonnées
    classified_pages: Dict[str, Any] = {}   # Structure de l'arbre classé
    total_pages: int = 0
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "bannettes"
        indexes = [
            "user_id",
            "name",
            "created_at",
        ]


class User(Document):
    """
    Modèle utilisateur avec authentification et vérification email
    """
    # Informations de base
    email: Indexed(EmailStr, unique=True)
    password_hash: Optional[str] = None
    google_id: Optional[str] = None
    auth_provider: str = "local"  # "local", "google", etc.

    # Profil
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None

    # Profil étendu
    job_title: Optional[str] = None
    bio: Optional[str] = None
    linkedin: Optional[str] = None
    twitter: Optional[str] = None
    website: Optional[str] = None
    location: Optional[str] = None

    # Statut et vérification
    status: UserStatusEnum = UserStatusEnum.PENDING
    is_email_verified: bool = False

    # Tokens de vérification
    email_verification_token: Optional[str] = None
    email_verification_expires: Optional[datetime] = None
    email_verified_at: Optional[datetime] = None

    # Token de reset password
    password_reset_token: Optional[str] = None
    password_reset_expires: Optional[datetime] = None
    password_changed_at: Optional[datetime] = None

    language: str = "fr"
    theme: str = "auto"
    notifications_enabled: bool = True

    # Dates
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login_at: Optional[datetime] = None

    # Références
    license_id: Optional[str] = None  # Référence vers License

    class Settings:
        name = "users"
        indexes = [
            "email",
            "status",
            "email_verification_token",
            "password_reset_token",
        ]
        use_state_management = True

    async def get_license(self) -> Optional[License]:
        """Récupère la licence de l'utilisateur"""
        if self.license_id:
            return await License.get(self.license_id)
        return None

    async def is_active(self) -> bool:
        """Vérifie si le compte est actif"""
        return self.status == UserStatusEnum.ACTIVE and self.is_email_verified

    @property
    def full_name(self) -> str:
        """Retourne le nom complet de l'utilisateur"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.email



class ScanProfile(Document):
    """
    Modèle pour les profils de scan
    """
    libele: str
    paper_size: str = "A4"
    horizontal_align: str = "center"
    resolution: int = 150
    scale: str = "100%"
    brightness: int = 50
    contrast: int = 50
    blank_page: str = "0"
    sensibility: Optional[str] = None
    default: str = "0"

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "scan_profiles"
        indexes = [
            "libele",
            "default",
        ]



async def init_default_models():
    """
    Initialisation des données par défaut
    """
    profiles_count = await ScanProfile.count()

    if profiles_count == 0:
        default_profile = ScanProfile(
            libele="Standard",
            paper_size="A4",
            horizontal_align="center",
            resolution=300,
            scale="100%",
            brightness=50,
            contrast=50,
            blank_page="0",
            sensibility="Auto",
            default="1"
        )
        await default_profile.insert()
   