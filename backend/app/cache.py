"""
Gestionnaire de cache Redis pour l'application Kairos WebScan
"""
import json
import logging
from typing import Optional, Any, List
from redis import Redis
from redis.exceptions import RedisError

logger = logging.getLogger(__name__)


class CacheManager:
    """
    Gestionnaire de cache Redis avec méthodes pour les différentes données de l'application
    """

    def __init__(self, host: str = "localhost", port: int = 6379, db: int = 0, password: Optional[str] = None):
        """
        Initialise la connexion Redis

        Args:
            host: Hôte Redis (défaut: localhost)
            port: Port Redis (défaut: 6379)
            db: Base de données Redis (défaut: 0)
            password: Mot de passe Redis (optionnel)
        """
        try:
            self.redis = Redis(
                host=host,
                port=port,
                db=db,
                password=password,
                decode_responses=True
            )
            # Tester la connexion
            self.redis.ping()
        except RedisError as e:
            self.redis = None

    def is_available(self) -> bool:
        """Vérifie si Redis est disponible"""
        if self.redis is None:
            return False
        try:
            self.redis.ping()
            return True
        except RedisError:
            return False


    def get_typology_tree(self) -> Optional[List[dict]]:
        """
        Récupère l'arbre de typologie depuis le cache

        Returns:
            Liste des types de documents ou None si pas en cache
        """
        if not self.is_available():
            return None

        try:
            data = self.redis.get("typology:tree")
            if data:
                return json.loads(data)
        except (RedisError, json.JSONDecodeError) as e:
            logger.error(f"❌ Erreur lors de la récupération du cache typology: {e}")

        return None

    def set_typology_tree(self, data: List[dict], ttl: int = 3600) -> bool:
        """
        Met en cache l'arbre de typologie

        Args:
            data: Liste des types de documents
            ttl: Durée de vie en secondes (défaut: 1 heure)

        Returns:
            True si succès, False sinon
        """
        if not self.is_available():
            return False

        try:
            self.redis.setex("typology:tree", ttl, json.dumps(data))
            return True
        except (RedisError, json.JSONDecodeError) as e:
            return False

    def invalidate_typology(self) -> bool:
        """
        Invalide le cache de la typologie

        Returns:
            True si succès, False sinon
        """
        if not self.is_available():
            return False

        try:
            self.redis.delete("typology:tree")
            return True
        except RedisError as e:
            return False


    def get_scan_profiles(self) -> Optional[List[dict]]:
        """
        Récupère les profils de scan depuis le cache

        Returns:
            Liste des profils ou None si pas en cache
        """
        if not self.is_available():
            return None

        try:
            data = self.redis.get("scan_profiles:list")
            if data:
                return json.loads(data)
        except (RedisError, json.JSONDecodeError) as e:
            logger.error(f"❌ Erreur lors de la récupération du cache scan profiles: {e}")

        return None

    def set_scan_profiles(self, data: List[dict], ttl: int = 1800) -> bool:
        """
        Met en cache les profils de scan

        Args:
            data: Liste des profils de scan
            ttl: Durée de vie en secondes (défaut: 30 minutes)

        Returns:
            True si succès, False sinon
        """
        if not self.is_available():
            return False

        try:
            self.redis.setex("scan_profiles:list", ttl, json.dumps(data))
            return True
        except (RedisError, json.JSONDecodeError) as e:
            return False

    def invalidate_scan_profiles(self) -> bool:
        """
        Invalide le cache des profils de scan

        Returns:
            True si succès, False sinon
        """
        if not self.is_available():
            return False

        try:
            self.redis.delete("scan_profiles:list")
            return True
        except RedisError as e:
            return False


    def get_thumbnail(self, doc_id: int, page_num: int) -> Optional[str]:
        """
        Récupère un thumbnail depuis le cache

        Args:
            doc_id: ID du document
            page_num: Numéro de page

        Returns:
            Données de l'image en base64 ou None si pas en cache
        """
        if not self.is_available():
            return None

        try:
            key = f"thumbnail:{doc_id}:{page_num}"
            data = self.redis.get(key)
            if data:
                return data
        except RedisError as e:
            logger.error(f"❌ Erreur lors de la récupération du cache thumbnail: {e}")

        return None

    def set_thumbnail(self, doc_id: int, page_num: int, image_data: str, ttl: int = 86400) -> bool:
        """
        Met en cache un thumbnail

        Args:
            doc_id: ID du document
            page_num: Numéro de page
            image_data: Données de l'image en base64
            ttl: Durée de vie en secondes (défaut: 24 heures)

        Returns:
            True si succès, False sinon
        """
        if not self.is_available():
            return False

        try:
            key = f"thumbnail:{doc_id}:{page_num}"
            self.redis.setex(key, ttl, image_data)
            return True
        except RedisError as e:
            return False

    def invalidate_document_thumbnails(self, doc_id: int) -> bool:
        """
        Invalide tous les thumbnails d'un document

        Args:
            doc_id: ID du document

        Returns:
            True si succès, False sinon
        """
        if not self.is_available():
            return False

        try:
            pattern = f"thumbnail:{doc_id}:*"
            keys = self.redis.keys(pattern)
            if keys:
                self.redis.delete(*keys)
            return True
        except RedisError as e:
            return False


    def get(self, key: str) -> Optional[Any]:
        """
        Récupère une valeur générique du cache

        Args:
            key: Clé de cache

        Returns:
            Valeur ou None si pas en cache
        """
        if not self.is_available():
            return None

        try:
            data = self.redis.get(key)
            if data:
                return json.loads(data)
        except (RedisError, json.JSONDecodeError):
            pass

        return None

    def set(self, key: str, value: Any, ttl: int = 3600) -> bool:
        """
        Met en cache une valeur générique

        Args:
            key: Clé de cache
            value: Valeur à mettre en cache
            ttl: Durée de vie en secondes (défaut: 1 heure)

        Returns:
            True si succès, False sinon
        """
        if not self.is_available():
            return False

        try:
            self.redis.setex(key, ttl, json.dumps(value))
            return True
        except (RedisError, json.JSONDecodeError):
            return False

    def delete(self, key: str) -> bool:
        """
        Supprime une clé du cache

        Args:
            key: Clé de cache

        Returns:
            True si succès, False sinon
        """
        if not self.is_available():
            return False

        try:
            self.redis.delete(key)
            return True
        except RedisError:
            return False

    def clear_all(self) -> bool:
        """
        Vide tout le cache (attention: operation destructive)

        Returns:
            True si succès, False sinon
        """
        if not self.is_available():
            return False

        try:
            self.redis.flushdb()
            return True
        except RedisError as e:
            return False


cache_manager: Optional[CacheManager] = None


def get_cache() -> Optional[CacheManager]:
    """
    Récupère l'instance globale du gestionnaire de cache

    Returns:
        CacheManager ou None si non initialisé
    """
    return cache_manager


def init_cache(host: str = "localhost", port: int = 6379, db: int = 0, password: Optional[str] = None) -> CacheManager:
    """
    Initialise l'instance globale du gestionnaire de cache

    Args:
        host: Hôte Redis
        port: Port Redis
        db: Base de données Redis
        password: Mot de passe Redis

    Returns:
        CacheManager initialisé
    """
    global cache_manager
    cache_manager = CacheManager(host=host, port=port, db=db, password=password)
    return cache_manager
