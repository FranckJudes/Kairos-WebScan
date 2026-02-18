"""
Services d'authentification : JWT, hash de mot de passe, tokens de vérification
"""
import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
import bcrypt
import secrets
import string

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 heures
EMAIL_VERIFICATION_EXPIRE_HOURS = 24
PASSWORD_RESET_EXPIRE_HOURS = 1



class PasswordManager:
    """Gestion du hashage et vérification des mots de passe"""

    @staticmethod
    def hash_password(password: str) -> str:
        """Hashe un mot de passe avec bcrypt"""
        password_bytes = password.encode('utf-8')[:72]
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        return hashed.decode('utf-8')

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Vérifie qu'un mot de passe en clair correspond au hash"""
        password_bytes = plain_password.encode('utf-8')[:72]
        try:
            hashed_bytes = hashed_password.encode('utf-8')
            return bcrypt.checkpw(password_bytes, hashed_bytes)
        except Exception:
            return False


class TokenManager:
    """Gestion des tokens JWT et de vérification"""

    @staticmethod
    def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """
        Crée un token JWT d'accès

        Args:
            data: Données à inclure dans le token (ex: {"sub": user_id})
            expires_delta: Durée de validité personnalisée

        Returns:
            Token JWT encodé
        """
        to_encode = data.copy()

        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

        to_encode.update({
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "access"
        })

        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt

    @staticmethod
    def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
        """
        Décode et vérifie un token JWT

        Args:
            token: Token JWT à décoder

        Returns:
            Données du token ou None si invalide
        """
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

            if payload.get("type") != "access":
                return None

            exp = payload.get("exp")
            now = datetime.utcnow()
            exp_datetime = datetime.fromtimestamp(exp) if exp else None


            if exp and exp_datetime < now:
                return None

            return payload
        except JWTError as e:
            return None

    @staticmethod
    def create_email_verification_token() -> str:
        """
        Crée un token sécurisé pour la vérification d'email
        Token de 64 caractères alphanumériques
        """
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(64))

    @staticmethod
    def create_password_reset_token() -> str:
        """
        Crée un token sécurisé pour la réinitialisation de mot de passe
        Token de 64 caractères alphanumériques
        """
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(64))

    @staticmethod
    def get_email_verification_expiration() -> datetime:
        """Retourne la date d'expiration du token de vérification email"""
        return datetime.utcnow() + timedelta(hours=EMAIL_VERIFICATION_EXPIRE_HOURS)

    @staticmethod
    def get_password_reset_expiration() -> datetime:
        """Retourne la date d'expiration du token de reset password"""
        return datetime.utcnow() + timedelta(hours=PASSWORD_RESET_EXPIRE_HOURS)

    @staticmethod
    def verify_token_expiration(expires_at: Optional[datetime]) -> bool:
        """
        Vérifie si un token est encore valide

        Args:
            expires_at: Date d'expiration du token

        Returns:
            True si le token est encore valide
        """
        if not expires_at:
            return False
        return datetime.utcnow() <= expires_at


class TokenType:
    """Types de tokens utilisés dans l'application"""
    ACCESS = "access"
    REFRESH = "refresh"
    EMAIL_VERIFICATION = "email_verification"
    PASSWORD_RESET = "password_reset"


def get_user_id_from_token(token: str) -> Optional[int]:
    """
    Extrait l'ID utilisateur depuis un token JWT

    Args:
        token: Token JWT

    Returns:
        ID utilisateur ou None si invalide
    """
    payload = TokenManager.decode_access_token(token)
    if payload:
        return payload.get("sub")
    return None


def create_user_token(user_id: int) -> str:
    """
    Crée un token pour un utilisateur

    Args:
        user_id: ID de l'utilisateur

    Returns:
        Token JWT
    """
    return TokenManager.create_access_token(
        data={"sub": str(user_id), "type": TokenType.ACCESS}
    )
