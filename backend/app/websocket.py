"""
Gestionnaire WebSocket pour les mises à jour en temps réel
"""
import logging
from typing import Set, Dict, Any, List
from fastapi import WebSocket
from json import JSONDecodeError

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Gestionnaire de connexions WebSocket pour le broadcast des mises à jour
    """

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.connection_ids: Dict[WebSocket, str] = {}

    async def connect(self, websocket: WebSocket, client_id: str = None):
        """
        Accepte une nouvelle connexion WebSocket

        Args:
            websocket: Connexion WebSocket
            client_id: ID optionnel du client
        """
        await websocket.accept()
        self.active_connections.add(websocket)
        if client_id:
            self.connection_ids[websocket] = client_id
        logger.info(f"✅ Client WebSocket connecté (total: {len(self.active_connections)})")

    def disconnect(self, websocket: WebSocket):
        """
        Déconnecte un client WebSocket

        Args:
            websocket: Connexion WebSocket à déconnecter
        """
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if websocket in self.connection_ids:
            del self.connection_ids[websocket]
        logger.info(f"❌ Client WebSocket déconnecté (total: {len(self.active_connections)})")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """
        Envoie un message à un client spécifique

        Args:
            message: Message à envoyer (dict qui sera sérialisé en JSON)
            websocket: Connexion WebSocket destinataire
        """
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"❌ Erreur lors de l'envoi du message personnel: {e}")
            self.disconnect(websocket)

    async def broadcast(self, message: dict, exclude: WebSocket = None):
        """
        Diffuse un message à tous les clients connectés

        Args:
            message: Message à diffuser (dict qui sera sérialisé en JSON)
            exclude: Connexion WebSocket à exclure (optionnel)
        """
        if not self.active_connections:
            logger.debug("⚠️ Aucun client WebSocket connecté pour le broadcast")
            return

        connections = list(self.active_connections)
        failed_connections = []

        for connection in connections:
            if exclude and connection == exclude:
                continue

            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"❌ Erreur lors du broadcast à un client: {e}")
                failed_connections.append(connection)

        for connection in failed_connections:
            self.disconnect(connection)

        if failed_connections:
            logger.warning(f"⚠️ {len(failed_connections)} connexion(s) échouée(s) lors du broadcast")

    # ========== Méthodes spécialisées pour les événements ==========

    async def notify_pages_classified(self, data: dict):
        """
        Notifie que des pages ont été classées

        Args:
            data: Données de la classification
                {
                    "document_id": int,
                    "pages": List[int],
                    "type_id": int,
                    "type_name": str
                }
        """
        message = {
            "type": "pages_classified",
            "data": data
        }
        await self.broadcast(message)
        logger.info(f"📢 Notification pages_classified envoyée à {len(self.active_connections)} client(s)")

    async def notify_pages_reinserted(self, data: dict):
        """
        Notifie que des pages ont été réinsérées

        Args:
            data: Données de la réinsertion
                {
                    "document_id": int,
                    "pages": List[int]
                }
        """
        message = {
            "type": "pages_reinserted",
            "data": data
        }
        await self.broadcast(message)
        logger.info(f"📢 Notification pages_reinserted envoyée à {len(self.active_connections)} client(s)")

    async def notify_instance_deleted(self, data: dict):
        """
        Notifie qu'une instance a été supprimée

        Args:
            data: Données de la suppression
                {
                    "instance_id": int,
                    "document_id": int,
                    "page_num": int
                }
        """
        message = {
            "type": "instance_deleted",
            "data": data
        }
        await self.broadcast(message)
        logger.info(f"📢 Notification instance_deleted envoyée à {len(self.active_connections)} client(s)")

    async def notify_typology_updated(self, data: dict):
        """
        Notifie que la typologie a été mise à jour

        Args:
            data: Données de la mise à jour
                {
                    "action": "created" | "updated" | "deleted",
                    "type_id": int,
                    "type_name": str
                }
        """
        message = {
            "type": "typology_updated",
            "data": data
        }
        await self.broadcast(message)
        logger.info(f"📢 Notification typology_updated envoyée à {len(self.active_connections)} client(s)")

    async def notify_scan_profile_updated(self, data: dict):
        """
        Notifie qu'un profil de scan a été mis à jour

        Args:
            data: Données de la mise à jour
                {
                    "action": "created" | "updated" | "deleted",
                    "profile_id": int,
                    "profile_name": str
                }
        """
        message = {
            "type": "scan_profile_updated",
            "data": data
        }
        await self.broadcast(message)
        logger.info(f"📢 Notification scan_profile_updated envoyée à {len(self.active_connections)} client(s)")

    async def notify_document_scanned(self, data: dict):
        """
        Notifie qu'un nouveau document a été scanné

        Args:
            data: Données du document
                {
                    "document_id": int,
                    "filename": str,
                    "page_count": int
                }
        """
        message = {
            "type": "document_scanned",
            "data": data
        }
        await self.broadcast(message)
        logger.info(f"📢 Notification document_scanned envoyée à {len(self.active_connections)} client(s)")

    async def notify_thumbnail_generated(self, data: dict):
        """
        Notifie qu'un thumbnail a été généré

        Args:
            data: Données du thumbnail
                {
                    "document_id": int,
                    "page_num": int,
                    "thumbnail_url": str
                }
        """
        message = {
            "type": "thumbnail_generated",
            "data": data
        }
        await self.broadcast(message)
        logger.info(f"📢 Notification thumbnail_generated envoyée à {len(self.active_connections)} client(s)")

    async def notify_batch_update(self, data: dict):
        """
        Notifie une mise à jour groupée (pour les opérations bulk)

        Args:
            data: Données de la mise à jour
                {
                    "operation": str,
                    "affected_items": List[dict]
                }
        """
        message = {
            "type": "batch_update",
            "data": data
        }
        await self.broadcast(message)
        logger.info(f"📢 Notification batch_update envoyée à {len(self.active_connections)} client(s)")

    def get_connection_count(self) -> int:
        """
        Retourne le nombre de connexions actives

        Returns:
            Nombre de connexions WebSocket actives
        """
        return len(self.active_connections)

    def get_connection_info(self) -> List[dict]:
        """
        Retourne des informations sur les connexions actives

        Returns:
            Liste des informations de connexion
        """
        return [
            {
                "client_id": self.connection_ids.get(ws, "unknown")
            }
            for ws in self.active_connections
        ]


# Instance globale du gestionnaire de connexions
manager: ConnectionManager = None


def get_manager() -> ConnectionManager:
    """
    Récupère l'instance globale du gestionnaire de connexions

    Returns:
        ConnectionManager
    """
    global manager
    if manager is None:
        manager = ConnectionManager()
    return manager


def init_websocket():
    """
    Initialise l'instance globale du gestionnaire de connexions
    """
    global manager
    manager = ConnectionManager()
    return manager
