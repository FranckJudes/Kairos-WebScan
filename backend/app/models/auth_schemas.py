"""
Schémas Pydantic pour l'authentification et les utilisateurs
Architecture séparée :
- Request: Données entrantes (creation, mise à jour)
- Response: Données sortantes (API)
"""
from pydantic import BaseModel, Field, EmailStr, field_validator, model_validator, ConfigDict
from pydantic.alias_generators import to_camel
from typing import Optional
from datetime import datetime
from enum import Enum



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



class RegisterRequest(BaseModel):
    """Schéma pour l'inscription"""
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    
    email: EmailStr = Field(..., description="Adresse email")
    password: str = Field(..., min_length=8, max_length=72, description="Mot de passe (min 8 caractères)")
    confirmPassword: str = Field(..., min_length=8, max_length=72, description="Confirmation du mot de passe")
    first_name: Optional[str] = Field(None, max_length=100, description="Prénom")
    last_name: Optional[str] = Field(None, max_length=100, description="Nom")
    acceptTerms: bool = Field(..., description="Acceptation des conditions d'utilisation")

    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Valide la force du mot de passe"""
        if not any(c.isupper() for c in v):
            raise ValueError('Le mot de passe doit contenir au moins une majuscule')
        if not any(c.islower() for c in v):
            raise ValueError('Le mot de passe doit contenir au moins une minuscule')
        if not any(c.isdigit() for c in v):
            raise ValueError('Le mot de passe doit contenir au moins un chiffre')
        return v

    @field_validator('confirmPassword')
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        """Vérifie que les mots de passe correspondent"""
        if 'password' in info.data and v != info.data['password']:
            raise ValueError('Les mots de passe ne correspondent pas')
        return v

    @field_validator('acceptTerms')
    @classmethod
    def terms_accepted(cls, v: bool) -> bool:
        """Vérifie que les conditions sont acceptées"""
        if not v:
            raise ValueError('Vous devez accepter les conditions dutilisation')
        return v


class LoginRequest(BaseModel):
    """Schéma pour la connexion"""
    model_config = ConfigDict(populate_by_name=True)
    
    email: EmailStr = Field(..., description="Adresse email")
    password: str = Field(..., description="Mot de passe")
    remember_me: bool = Field(default=False, alias="rememberMe", description="Se souvenir de moi")


class VerifyEmailRequest(BaseModel):
    """Schéma pour la vérification d'email"""
    token: str = Field(..., description="Token de vérification")


class ForgotPasswordRequest(BaseModel):
    """Schéma pour la demande de réinitialisation"""
    email: EmailStr = Field(..., description="Adresse email")


class ResetPasswordRequest(BaseModel):
    """Schéma pour la réinitialisation du mot de passe"""
    token: str = Field(..., description="Token de réinitialisation")
    password: str = Field(..., min_length=8, max_length=72, description="Nouveau mot de passe")
    confirmPassword: str = Field(..., min_length=8, max_length=72, description="Confirmation du mot de passe")

    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Valide la force du mot de passe"""
        if not any(c.isupper() for c in v):
            raise ValueError('Le mot de passe doit contenir au moins une majuscule')
        if not any(c.islower() for c in v):
            raise ValueError('Le mot de passe doit contenir au moins une minuscule')
        if not any(c.isdigit() for c in v):
            raise ValueError('Le mot de passe doit contenir au moins un chiffre')
        return v

    @model_validator(mode='after')
    def passwords_match(self) -> 'ResetPasswordRequest':
        """Vérifie que les mots de passe correspondent"""
        if self.password != self.confirmPassword:
            raise ValueError('Les mots de passe ne correspondent pas')
        return self


class UpdateProfileRequest(BaseModel):
    """Schéma pour la mise à jour du profil"""
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    avatar_url: Optional[str] = Field(None, max_length=500)
    job_title: Optional[str] = Field(None, max_length=200)
    bio: Optional[str] = Field(None, max_length=1000)
    linkedin: Optional[str] = Field(None, max_length=500)
    twitter: Optional[str] = Field(None, max_length=500)
    website: Optional[str] = Field(None, max_length=500)
    location: Optional[str] = Field(None, max_length=200)


class ChangePasswordRequest(BaseModel):
    """Schéma pour le changement de mot de passe"""
    currentPassword: str = Field(..., description="Mot de passe actuel")
    newPassword: str = Field(..., min_length=8, max_length=72, description="Nouveau mot de passe")
    confirmNewPassword: str = Field(..., min_length=8, max_length=72, description="Confirmation du nouveau mot de passe")

    @field_validator('newPassword')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Valide la force du mot de passe"""
        if not any(c.isupper() for c in v):
            raise ValueError('Le mot de passe doit contenir au moins une majuscule')
        if not any(c.islower() for c in v):
            raise ValueError('Le mot de passe doit contenir au moins une minuscule')
        if not any(c.isdigit() for c in v):
            raise ValueError('Le mot de passe doit contenir au moins un chiffre')
        return v

    @model_validator(mode='after')
    def passwords_match(self) -> 'ChangePasswordRequest':
        """Vérifie que les mots de passe correspondent"""
        if self.newPassword != self.confirmNewPassword:
            raise ValueError('Les mots de passe ne correspondent pas')
        return self


class UpdatePreferencesRequest(BaseModel):
    """Schéma pour la mise à jour des préférences"""
    language: Optional[str] = Field(None, pattern="^(fr|en|es|de|it)$", description="Langue préférée")
    theme: Optional[str] = Field(None, pattern="^(light|dark|auto)$", description="Thème")
    notifications_enabled: Optional[bool] = Field(None, description="Notifications activées")



class UserResponse(BaseModel):
    """Réponse utilisateur - Informations de base"""
    id: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    job_title: Optional[str] = None
    bio: Optional[str] = None
    linkedin: Optional[str] = None
    twitter: Optional[str] = None
    website: Optional[str] = None
    location: Optional[str] = None
    status: UserStatusEnum
    is_email_verified: bool
    language: Optional[str] = None
    theme: Optional[str] = None
    notifications_enabled: bool
    created_at: datetime
    last_login_at: Optional[datetime] = None


class LicenseResponse(BaseModel):
    """Réponse licence - Informations licence"""
    id: str
    license_type: LicenseTypeEnum
    scans_per_month: int
    scans_used_this_month: int
    documents_storage_mb: int
    documents_used_storage_mb: float
    expires_at: Optional[datetime] = None
    ocre_available: bool
    cloud_storage_available: bool
    api_access_available: bool
    priority_support_available: bool
    advanced_filters_available: bool
    batch_processing_available: bool


class RecentDocumentResponse(BaseModel):
    """Réponse document récent"""
    id: str
    document_id: int
    document_name: str
    document_type: str
    accessed_at: datetime


class UserProfileResponse(BaseModel):
    """Réponse profil complet - Utilisateur + Licence + Documents"""
    user: UserResponse
    license: Optional[LicenseResponse] = None
    recent_documents: list[RecentDocumentResponse] = []


class AuthResponse(BaseModel):
    """Réponse authentification - Token + User"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class MessageResponse(BaseModel):
    """Réponse message générique"""
    message: str
    success: bool = True


class PasswordStrengthResponse(BaseModel):
    """Réponse force mot de passe"""
    score: int = Field(..., ge=0, le=5, description="Score de 0 à 5")
    label: str = Field(..., description="Label: Très faible, Faible, Moyen, Fort, Très fort")
    suggestions: list[str] = []


class ErrorResponse(BaseModel):
    """Réponse d'erreur"""
    error: str
    detail: Optional[str] = None
    success: bool = False
