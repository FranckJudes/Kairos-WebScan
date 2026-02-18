"""
Service métier pour la gestion des utilisateurs avec MongoDB
"""
from typing import Optional, Dict, Any
from datetime import datetime

from ..models.mongo_models import User, License, RecentDocument, LicenseTypeEnum
from .auth import PasswordManager, TokenManager


class UserService:
    """Service métier pour les opérations utilisateurs"""

    @staticmethod
    async def create_user(
        email: str,
        password: str,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None
    ) -> User:
        """
        Crée un nouvel utilisateur

        Args:
            email: Adresse email
            password: Mot de passe en clair
            first_name: Prénom
            last_name: Nom

        Returns:
            Utilisateur créé

        Raises:
            ValueError: Si l'email existe déjà
        """
        # Vérifier si l'email existe déjà
        existing_user = await User.find_one(User.email == email)
        if existing_user:
            raise ValueError("Un utilisateur avec cet email existe déjà")

        # Hasher le mot de passe
        password_hash = PasswordManager.hash_password(password)

        # Créer l'utilisateur
        user = User(
            email=email,
            password_hash=password_hash,
            first_name=first_name,
            last_name=last_name,
            status="pending",
            is_email_verified=False
        )

        await user.insert()

        # Créer la licence FREE par défaut
        license = License(
            license_type=LicenseTypeEnum.FREE,
            scans_per_month=10,
            scans_used_this_month=0,
            documents_storage_mb=100,
            documents_used_storage_mb=0.0,
            ocre_available=False,
            cloud_storage_available=False,
            api_access_available=False,
            priority_support_available=False,
            advanced_filters_available=False,
            batch_processing_available=False
        )

        await license.insert()

        # Lier la licence à l'utilisateur
        user.license_id = str(license.id)
        await user.save()

        return user

    @staticmethod
    async def authenticate_user(email: str, password: str) -> Optional[User]:
        """
        Authentifie un utilisateur

        Args:
            email: Adresse email
            password: Mot de passe en clair

        Returns:
            Utilisateur si authentifié, None sinon
        """
        user = await User.find_one(User.email == email)

        if not user:
            return None

        if not PasswordManager.verify_password(password, user.password_hash):
            return None

        return user

    @staticmethod
    async def verify_email(token: str) -> bool:
        """
        Vérifie l'email d'un utilisateur

        Args:
            token: Token de vérification

        Returns:
            True si vérifié avec succès
        """
        user = await User.find_one(User.email_verification_token == token)

        if not user:
            return False

        # Vérifier l'expiration du token
        if user.email_verification_expires and user.email_verification_expires < datetime.utcnow():
            return False

        # Marquer l'email comme vérifié
        user.is_email_verified = True
        user.status = "active"
        user.email_verification_token = None
        user.email_verification_expires = None
        user.email_verified_at = datetime.utcnow()

        await user.save()
        return True

    @staticmethod
    async def generate_password_reset_token(email: str) -> Optional[User]:
        """
        Génère un token de réinitialisation de mot de passe

        Args:
            email: Adresse email

        Returns:
            Utilisateur si trouvé, None sinon
        """
        user = await User.find_one(User.email == email)

        if not user:
            return None

        # Générer le token
        reset_token = TokenManager.create_password_reset_token()
        expires_at = TokenManager.get_password_reset_expiration()

        user.password_reset_token = reset_token
        user.password_reset_expires = expires_at

        await user.save()
        return user

    @staticmethod
    async def reset_password(token: str, new_password: str) -> bool:
        """
        Réinitialise le mot de passe d'un utilisateur

        Args:
            token: Token de réinitialisation
            new_password: Nouveau mot de passe

        Returns:
            True si réinitialisé avec succès
        """
        user = await User.find_one(User.password_reset_token == token)

        if not user:
            return False

        # Vérifier l'expiration du token
        if user.password_reset_expires and user.password_reset_expires < datetime.utcnow():
            return False

        # Mettre à jour le mot de passe
        user.password_hash = PasswordManager.hash_password(new_password)
        user.password_reset_token = None
        user.password_reset_expires = None
        user.password_changed_at = datetime.utcnow()

        await user.save()
        return True

    @staticmethod
    async def update_profile(
        user_id: str,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        phone: Optional[str] = None
    ) -> Optional[User]:
        """
        Met à jour le profil d'un utilisateur

        Args:
            user_id: ID de l'utilisateur (ObjectId)
            first_name: Prénom
            last_name: Nom
            phone: Téléphone

        Returns:
            Utilisateur mis à jour
        """
        user = await User.get(user_id)

        if not user:
            return None

        if first_name is not None:
            user.first_name = first_name
        if last_name is not None:
            user.last_name = last_name
        if phone is not None:
            user.phone = phone

        user.updated_at = datetime.utcnow()
        await user.save()

        return user

    @staticmethod
    async def change_password(
        user_id: str,
        current_password: str,
        new_password: str
    ) -> bool:
        """
        Change le mot de passe d'un utilisateur

        Args:
            user_id: ID de l'utilisateur (ObjectId)
            current_password: Mot de passe actuel
            new_password: Nouveau mot de passe

        Returns:
            True si changé avec succès

        Raises:
            ValueError: Si le mot de passe actuel est incorrect
        """
        user = await User.get(user_id)

        if not user:
            return False

        if not PasswordManager.verify_password(current_password, user.password_hash):
            raise ValueError("Mot de passe actuel incorrect")

        user.password_hash = PasswordManager.hash_password(new_password)
        user.password_changed_at = datetime.utcnow()
        user.updated_at = datetime.utcnow()

        await user.save()
        return True

    @staticmethod
    async def update_preferences(
        user_id: str,
        language: Optional[str] = None,
        theme: Optional[str] = None,
        notifications_enabled: Optional[bool] = None
    ) -> Optional[User]:
        """
        Met à jour les préférences d'un utilisateur

        Args:
            user_id: ID de l'utilisateur (ObjectId)
            language: Langue préférée
            theme: Thème (light/dark)
            notifications_enabled: Notifications activées

        Returns:
            Utilisateur mis à jour
        """
        user = await User.get(user_id)

        if not user:
            return None

        if language is not None:
            user.language = language
        if theme is not None:
            user.theme = theme
        if notifications_enabled is not None:
            user.notifications_enabled = notifications_enabled

        user.updated_at = datetime.utcnow()
        await user.save()

        return user

    @staticmethod
    async def add_recent_document(
        user_id: str,
        document_id: int,
        document_name: str,
        document_type: str
    ) -> RecentDocument:
        """
        Ajoute un document aux documents récents

        Args:
            user_id: ID de l'utilisateur (ObjectId)
            document_id: ID du document
            document_name: Nom du document
            document_type: Type du document

        Returns:
            Document récent créé
        """
        # Vérifier si le document existe déjà dans les récents
        existing = await RecentDocument.find_one(
            RecentDocument.user_id == user_id,
            RecentDocument.document_id == document_id
        )

        if existing:
            # Mettre à jour la date d'accès
            existing.accessed_at = datetime.utcnow()
            await existing.save()
            return existing

        # Créer une nouvelle entrée
        recent_doc = RecentDocument(
            user_id=user_id,
            document_id=document_id,
            document_name=document_name,
            document_type=document_type
        )

        await recent_doc.insert()

        # Limiter à 10 documents récents par utilisateur
        recent_count = await RecentDocument.find(
            RecentDocument.user_id == user_id
        ).count()

        if recent_count > 10:
            # Supprimer les plus anciens
            oldest = await RecentDocument.find(
                RecentDocument.user_id == user_id
            ).sort(+RecentDocument.accessed_at).first_or_none()

            if oldest:
                await oldest.delete()

        return recent_doc

    @staticmethod
    async def get_user_profile(user_id: str) -> Optional[Dict[str, Any]]:
        """
        Récupère le profil complet d'un utilisateur

        Args:
            user_id: ID de l'utilisateur (ObjectId)

        Returns:
            Dictionnaire avec les infos utilisateur et licence
        """
        user = await User.get(user_id)

        if not user:
            return None

        license = None
        if user.license_id:
            license = await License.get(user.license_id)

        recent_docs = await RecentDocument.find(
            RecentDocument.user_id == user_id
        ).sort(-RecentDocument.accessed_at).limit(10).to_list()

        return {
            "user": {
                "id": str(user.id),
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "phone": user.phone,
                "avatar_url": user.avatar_url,
                "status": user.status.value,
                "is_email_verified": user.is_email_verified,
                "language": user.language,
                "theme": user.theme,
                "notifications_enabled": user.notifications_enabled,
                "created_at": user.created_at,
                "last_login_at": user.last_login_at
            },
            "license": {
                "id": str(license.id),
                "license_type": license.license_type.value,
                "scans_per_month": license.scans_per_month,
                "scans_used_this_month": license.scans_used_this_month,
                "documents_storage_mb": license.documents_storage_mb,
                "documents_used_storage_mb": license.documents_used_storage_mb,
                "expires_at": license.expires_at,
                "ocre_available": license.ocre_available,
                "cloud_storage_available": license.cloud_storage_available,
                "api_access_available": license.api_access_available,
                "priority_support_available": license.priority_support_available,
                "advanced_filters_available": license.advanced_filters_available,
                "batch_processing_available": license.batch_processing_available
            } if license else None,
            "recent_documents": [
                {
                    "id": str(doc.id),
                    "document_id": doc.document_id,
                    "document_name": doc.document_name,
                    "document_type": doc.document_type,
                    "accessed_at": doc.accessed_at
                }
                for doc in recent_docs
            ]
        }

    @staticmethod
    async def update_last_login(user_id: str) -> None:
        """
        Met à jour la date de dernière connexion

        Args:
            user_id: ID de l'utilisateur (ObjectId)
        """
        user = await User.get(user_id)
        if user:
            user.last_login_at = datetime.utcnow()
            await user.save()
