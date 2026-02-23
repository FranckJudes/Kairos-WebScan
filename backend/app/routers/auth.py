"""
Router API pour l'authentification et la gestion des comptes utilisateurs (MongoDB)
"""
from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie, Request, UploadFile, File
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Any
from datetime import datetime, timezone
import json
import secrets
import string
from ..models.auth_schemas import (
    RegisterRequest,
    LoginRequest,
    VerifyEmailRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UpdateProfileRequest,
    ChangePasswordRequest,
    UpdatePreferencesRequest,
    AuthResponse,
    UserProfileResponse,
    MessageResponse,
    PasswordStrengthResponse,
    UserResponse,
    ErrorResponse
)
from ..models.mongo_models import User, UserStatusEnum
from ..services.user_service_mongo import UserService
from ..services.auth import TokenManager, create_user_token, get_user_id_from_token
from ..services.image_service import ImageService
from ..services.email import get_email_service
from ..cache import get_cache
from ..tasks import send_verification_email, send_password_reset_email, send_welcome_email
from authlib.integrations.starlette_client import OAuth
import os

# Créer le router
router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

security = HTTPBearer(auto_error=False)

oauth = OAuth()
oauth.register(
    name='google',
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)



def get_current_user(
    access_token: Optional[str] = Cookie(None),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> str:
    """
    Récupère l'ID de l'utilisateur actuel depuis le token JWT (header ou cookie)
    """
    token = None

    # Priorité au header Authorization (souvent géré manuellement par le frontend)
    if credentials:
        token = credentials.credentials

    if not token and access_token:
        token = access_token

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token d'authentification manquant",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = get_user_id_from_token(token)

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expirée ou token invalide",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user_id


async def get_current_user_active(
    user_id: str = Depends(get_current_user)
) -> User:
    """
    Récupère l'utilisateur actif depuis son ID

    Args:
        user_id: ID de l'utilisateur

    Returns:
        Utilisateur actif

    Raises:
        HTTPException: Si l'utilisateur n'existe pas ou n'est pas actif
    """
    user = await User.get(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur non trouvé",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.status == UserStatusEnum.SUSPENDED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Compte suspendu"
        )

    if user.status == UserStatusEnum.DELETED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Compte supprimé"
        )

    return user


async def get_current_verified_user(
    user: User = Depends(get_current_user_active)
) -> User:
    """
    Vérifie que l'utilisateur est actif

    Args:
        user: Utilisateur actuel

    Returns:
        Utilisateur actif

    Raises:
        HTTPException: Si l'utilisateur n'est pas actif
    """
    if user.status != UserStatusEnum.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Compte inactif"
        )

    return user



@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: RegisterRequest
):
    """
    Inscription d'un nouvel utilisateur

    Le compte est créé directement sans vérification email.
    """
    try:
        user = await UserService.create_user(
            email=request.email,
            password=request.password,
            first_name=request.first_name,
            last_name=request.last_name
        )

        user.is_email_verified = True
        user.status = UserStatusEnum.ACTIVE
        user.email_verification_token = None
        user.email_verification_expires = None
        user.email_verified_at = datetime.now(timezone.utc)
        await user.save()

        user_name = f"{user.first_name or ''} {user.last_name or ''}".strip() or user.email
        send_welcome_email.delay(
            to_email=user.email,
            to_name=user_name
        )

        return MessageResponse(
            message="Inscription réussie. Vous pouvez maintenant vous connecter.",
            success=True
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'inscription: {str(e)}"
        )


@router.post("/login", response_model=AuthResponse)
async def login(
    request: LoginRequest,
    response: Response
):
    """
    Connexion d'un utilisateur
    """
    user = await UserService.authenticate_user(
        email=request.email,
        password=request.password
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )

    await UserService.update_last_login(str(user.id))

    access_token = create_user_token(str(user.id))

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=60 * 60 * 24,
        path="/"
    )

    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            phone=user.phone,
            avatar_url=user.avatar_url,
            job_title=user.job_title,
            bio=user.bio,
            linkedin=user.linkedin,
            twitter=user.twitter,
            website=user.website,
            location=user.location,
            status=user.status,
            is_email_verified=user.is_email_verified,
            language=user.language,
            theme=user.theme,
            notifications_enabled=user.notifications_enabled,
            created_at=user.created_at,
            last_login_at=user.last_login_at
        )
    )

@router.post("/logout")
async def logout(response: Response):
    """
    Déconnexion de l'utilisateur (suppression du cookie)
    """
    response.delete_cookie(
        key="access_token",
        httponly=True,
        samesite="lax",
        path="/"
    )
    return {"message": "Déconnexion réussie"}


@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(
    request: VerifyEmailRequest
):
    """
    Vérification de l'email d'un utilisateur

    Valide le token envoyé par email.
    """
    success = await UserService.verify_email(request.token)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token de vérification invalide ou expiré"
        )

    user = await User.find_one(User.email_verification_token == request.token)
    if user:
        user_name = f"{user.first_name or ''} {user.last_name or ''}".strip() or user.email
        send_welcome_email.delay(
            to_email=user.email,
            to_name=user_name
        )

    return MessageResponse(
        message="Email vérifié avec succès. Votre compte est maintenant actif.",
        success=True
    )


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    request: ForgotPasswordRequest
):
    """
    Demande de réinitialisation de mot de passe

    Envoie un email avec un lien de réinitialisation.
    """
    user = await UserService.generate_password_reset_token(request.email)

    if user:
        user_name = f"{user.first_name or ''} {user.last_name or ''}".strip() or user.email
        send_password_reset_email.delay(
            to_email=user.email,
            to_name=user_name,
            reset_token=user.password_reset_token
        )

    return MessageResponse(
        message="Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.",
        success=True
    )


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    request: ResetPasswordRequest
):
    """
    Réinitialisation du mot de passe

    Valide le token et met à jour le mot de passe.
    """
    success = await UserService.reset_password(
        token=request.token,
        new_password=request.password
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token de réinitialisation invalide ou expiré"
        )

    return MessageResponse(
        message="Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.",
        success=True
    )


@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_verified_user)
):
    """
    Récupère le profil complet de l'utilisateur actuel

    Inclut les informations de licence et les documents récents.
    """
    profile = await UserService.get_user_profile(str(current_user.id))

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profil non trouvé"
        )

    return UserProfileResponse(**profile)


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    request: UpdateProfileRequest,
    current_user: User = Depends(get_current_verified_user)
):
    """
    Met à jour le profil de l'utilisateur actuel
    """
    user = await UserService.update_profile(
        user_id=str(current_user.id),
        first_name=request.first_name,
        last_name=request.last_name,
        phone=request.phone,
        avatar_url=request.avatar_url,
        job_title=request.job_title,
        bio=request.bio,
        linkedin=request.linkedin,
        twitter=request.twitter,
        website=request.website,
        location=request.location
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )

    return UserResponse(
        id=str(user.id),
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        phone=user.phone,
        avatar_url=user.avatar_url,
        job_title=user.job_title,
        bio=user.bio,
        linkedin=user.linkedin,
        twitter=user.twitter,
        website=user.website,
        location=user.location,
        status=user.status,
        is_email_verified=user.is_email_verified,
        language=user.language,
        theme=user.theme,
        notifications_enabled=user.notifications_enabled,
        created_at=user.created_at,
        last_login_at=user.last_login_at
    )


@router.post("/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_verified_user)
):
    """
    Upload et redimensionne l'avatar d'un utilisateur

    Valide l'image, la redimensionne (max 400x400px) et la sauvegarde.
    """
    # Valider l'image
    ImageService.validate_image(file)

    # Traiter et sauvegarder l'image
    avatar_url = await ImageService.process_avatar(
        file=file,
        user_id=str(current_user.id)
    )

    # Mettre à jour l'utilisateur avec la nouvelle URL
    user = await UserService.update_profile(
        user_id=str(current_user.id),
        avatar_url=avatar_url
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )

    return {
        "success": True,
        "message": "Avatar mis à jour avec succès",
        "avatar_url": avatar_url
    }


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_verified_user)
):
    """
    Change le mot de passe de l'utilisateur actuel
    """
    try:
        success = await UserService.change_password(
            user_id=str(current_user.id),
            current_password=request.currentPassword,
            new_password=request.newPassword
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erreur lors du changement de mot de passe"
            )

        return MessageResponse(
            message="Mot de passe changé avec succès.",
            success=True
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/preferences", response_model=UserResponse)
async def update_preferences(
    request: UpdatePreferencesRequest,
    current_user: User = Depends(get_current_verified_user)
):
    """
    Met à jour les préférences de l'utilisateur actuel
    """
    user = await UserService.update_preferences(
        user_id=str(current_user.id),
        language=request.language,
        theme=request.theme,
        notifications_enabled=request.notifications_enabled
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )

    return UserResponse(
        id=str(user.id),
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        phone=user.phone,
        avatar_url=user.avatar_url,
        job_title=user.job_title,
        bio=user.bio,
        linkedin=user.linkedin,
        twitter=user.twitter,
        website=user.website,
        location=user.location,
        status=user.status,
        is_email_verified=user.is_email_verified,
        language=user.language,
        theme=user.theme,
        notifications_enabled=user.notifications_enabled,
        created_at=user.created_at,
        last_login_at=user.last_login_at
    )


@router.post("/logout", response_model=MessageResponse)
async def logout(
    current_user: User = Depends(get_current_user_active)
):
    """
    Déconnexion de l'utilisateur

    Note: Avec JWT stateless, la déconnexion se fait côté client
    en supprimant le token. Ce endpoint peut être utilisé pour
    des logs ou pour invalider le token dans un cache Redis.
    """
    cache = get_cache()
    if cache.is_available():
        pass

    return MessageResponse(
        message="Déconnexion réussie",
        success=True
    )


@router.get("/google/login")
async def google_login(request: Request):
    """Redirige vers la page de connexion Google"""
    redirect_uri = request.url_for('google_callback')
    return await oauth.google.authorize_redirect(request, str(redirect_uri))


@router.get("/google/callback", name="google_callback")
async def google_callback(request: Request):
    """Callback après authentification Google"""
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get('userinfo')
        if not user_info:
            raise HTTPException(status_code=400, detail="Impossible de récupérer les infos Google")

        email = user_info.get('email')
        google_id = user_info.get('sub')
        first_name = user_info.get('given_name')
        last_name = user_info.get('family_name')
        avatar_url = user_info.get('picture')

        user = await User.find_one(User.google_id == google_id)
        if not user:
            user = await User.find_one(User.email == email)
            if user:
                user.google_id = google_id
                user.auth_provider = "google"
                if not user.avatar_url:
                    user.avatar_url = avatar_url
                await user.save()
            else:
                user = await UserService.create_user(
                    email=email,
                    password=secrets.token_urlsafe(32),
                    first_name=first_name,
                    last_name=last_name
                )
                user.google_id = google_id
                user.auth_provider = "google"
                user.avatar_url = avatar_url
                user.is_email_verified = True
                user.status = UserStatusEnum.ACTIVE
                user.email_verified_at = datetime.now(timezone.utc)
                await user.save()
                
                send_welcome_email.delay(to_email=email, to_name=user.full_name)

        await UserService.update_last_login(str(user.id))
        access_token = create_user_token(str(user.id))

        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        response = RedirectResponse(url=f"{frontend_url}/login/callback")

        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=60 * 60 * 24,
            path="/"
        )
        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur OAuth: {str(e)}")


@router.post("/check-password-strength", response_model=PasswordStrengthResponse)
async def check_password_strength(password: str):
    """
    Vérifie la force d'un mot de passe

    Retourne un score de 0 à 5 et des suggestions.
    """
    score = 0
    suggestions = []

    if len(password) >= 8:
        score += 1
    else:
        suggestions.append("Au moins 8 caractères")

    if any(c.isupper() for c in password):
        score += 1
    else:
        suggestions.append("Au moins une majuscule")

    if any(c.islower() for c in password):
        score += 1
    else:
        suggestions.append("Au moins une minuscule")

    if any(c.isdigit() for c in password):
        score += 1
    else:
        suggestions.append("Au moins un chiffre")

    if any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        score += 1
    else:
        suggestions.append("Au moins un caractère spécial (!@#$%^&*...)")

    labels = {
        0: "Très faible",
        1: "Très faible",
        2: "Faible",
        3: "Moyen",
        4: "Fort",
        5: "Très fort"
    }

    return PasswordStrengthResponse(
        score=score,
        label=labels[score],
        suggestions=suggestions
    )
