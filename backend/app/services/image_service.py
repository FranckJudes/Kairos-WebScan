"""
Service pour le traitement des images avatars
"""
from PIL import Image
import os
import uuid
from typing import Optional
from fastapi import UploadFile, HTTPException


class ImageService:
    """Service pour le traitement des images avatars"""

    # Extensions autorisées
    ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}
    ALLOWED_MIME_TYPES = {'image/jpeg', 'image/png', 'image/webp'}

    # Dimensions max de l'avatar
    MAX_SIZE = (400, 400)

    # Taille max du fichier (5MB)
    MAX_FILE_SIZE = 5 * 1024 * 1024

    @staticmethod
    def validate_image(file: UploadFile) -> None:
        """
        Valide que le fichier est une image acceptée

        Args:
            file: Fichier uploadé

        Raises:
            HTTPException: Si le fichier n'est pas valide
        """
        # Vérifier l'extension
        _, ext = os.path.splitext(file.filename or '')
        if ext.lower() not in ImageService.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Extension non autorisée. Extensions acceptées: {', '.join(ImageService.ALLOWED_EXTENSIONS)}"
            )

        # Vérifier le MIME type
        if file.content_type not in ImageService.ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Type de fichier non autorisé. Types acceptés: {', '.join(ImageService.ALLOWED_MIME_TYPES)}"
            )

    @staticmethod
    async def process_avatar(
        file: UploadFile,
        user_id: str,
        upload_dir: str = "uploads/avatars"
    ) -> str:
        """
        Traite et sauvegarde l'avatar d'un utilisateur

        Args:
            file: Fichier uploadé
            user_id: ID de l'utilisateur
            upload_dir: Répertoire de destination

        Returns:
            URL relative de l'image sauvegardée

        Raises:
            HTTPException: Si une erreur survient
        """
        try:
            # Lire le contenu du fichier
            contents = await file.read()

            # Vérifier la taille
            if len(contents) > ImageService.MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=400,
                    detail=f"Fichier trop volumineux. Maximum {ImageService.MAX_FILE_SIZE // (1024 * 1024)}MB"
                )

            # Ouvrir l'image avec PIL
            image = Image.open(io.BytesIO(contents))

            # Convertir en RGB si nécessaire (pour les PNG avec transparence)
            if image.mode in ('RGBA', 'LA', 'P'):
                # Créer un fond blanc
                background = Image.new('RGB', image.size, (255, 255, 255))
                if image.mode == 'P':
                    image = image.convert('RGBA')
                background.paste(image, mask=image.split()[-1] if image.mode in ('RGBA', 'LA') else None)
                image = background

            # Redimensionner si nécessaire (maintenir le ratio)
            image.thumbnail(ImageService.MAX_SIZE, Image.Resampling.LANCZOS)

            # Générer un nom de fichier unique
            ext = '.jpg'  # Toujours sauvegarder en JPG
            filename = f"{user_id}_{uuid.uuid4().hex[:12]}{ext}"

            # Créer le répertoire si nécessaire
            os.makedirs(upload_dir, exist_ok=True)

            # Chemin complet
            filepath = os.path.join(upload_dir, filename)

            # Sauvegarder l'image en JPG avec qualité optimisée
            image.save(filepath, 'JPEG', quality=85, optimize=True)

            # Retourner l'URL relative
            return f"/{upload_dir}/{filename}"

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Erreur lors du traitement de l'image: {str(e)}"
            )

    @staticmethod
    def delete_avatar(avatar_url: Optional[str], upload_dir: str = "uploads/avatars") -> None:
        """
        Supprime un fichier d'avatar

        Args:
            avatar_url: URL de l'avatar
            upload_dir: Répertoire des avatars
        """
        if not avatar_url:
            return

        try:
            # Extraire le nom du fichier de l'URL
            filename = avatar_url.split('/')[-1]

            # Chemin complet
            filepath = os.path.join(upload_dir, filename)

            # Supprimer le fichier s'il existe
            if os.path.exists(filepath):
                os.remove(filepath)
        except Exception:
            # Ne pas échouer si la suppression ne fonctionne pas
            pass


# Importer io au niveau du module
import io
