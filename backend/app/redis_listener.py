"""
Listener Redis Pub/Sub pour les mises à jour en temps réel depuis Celery
Écoute les messages sur le canal "document_updates" et diffuse via WebSocket
"""
import logging
import json
import asyncio
import threading
from typing import Optional, Callable
from queue import Queue
from .websocket import get_manager

logger = logging.getLogger(__name__)


class RedisListener:
    """Écoute les messages Redis Pub/Sub et diffuse via WebSocket"""

    def __init__(self):
        self.redis_client = None
        self.listener_thread: Optional[threading.Thread] = None
        self.is_running = False
        self.message_queue: Optional[asyncio.Queue] = None
        self.loop: Optional[asyncio.AbstractEventLoop] = None

    async def start(self):
        """Démarre l'écoute des messages Redis"""
        if self.is_running:
            return

        try:
            # Créer un client Redis séparé pour pub/sub
            import redis as redis_lib
            self.redis_client = redis_lib.Redis(
                host="localhost",
                port=6379,
                db=0,
                decode_responses=True
            )

            try:
                self.redis_client.ping()
            except Exception as e:
                self.redis_client = None
                return

            self.message_queue = asyncio.Queue()
            self.loop = asyncio.get_event_loop()

            self.is_running = True
            self.listener_thread = threading.Thread(
                target=self._listen_in_thread,
                daemon=True,
                name="RedisListenerThread"
            )
            self.listener_thread.start()

            asyncio.create_task(self._process_messages())

        except Exception as e:
            self.is_running = False

    async def stop(self):
        """Arrête l'écoute des messages Redis"""
        self.is_running = False

        if self.listener_thread:
            self.listener_thread.join(timeout=2.0)
            self.listener_thread = None

        if self.redis_client:
            self.redis_client.close()
            self.redis_client = None


    def _listen_in_thread(self):
        """
        Écoute les messages Redis dans un thread séparé
        Cette méthode tourne dans un thread synchrone
        """
        try:
            pubsub = self.redis_client.pubsub()
            pubsub.subscribe("document_updates")


            while self.is_running:
                message = pubsub.get_message(timeout=1.0)

                if message and message["type"] == "message":
                    try:
                        data = json.loads(message["data"])
                        if self.loop and self.message_queue:
                            asyncio.run_coroutine_threadsafe(
                                self.message_queue.put(data),
                                self.loop
                            )
                    except json.JSONDecodeError as e:
                        logger.error(f"Erreur décodage message JSON: {e}")
                    except Exception as e:
                        logger.error(f"Erreur traitement message: {e}")
                elif message:
                    logger.debug(f"📨 [Thread] Message Redis (type: {message['type']})")

            pubsub.close()

        except Exception as e:
            logger.error(f"Erreur dans le thread d'écoute Redis: {e}")

    async def _process_messages(self):
        """
        Traite les messages de la queue et les diffuse via WebSocket
        Cette méthode tourne dans la boucle d'événements async
        """
        try:
            while self.is_running:
                try:
                    # Attendre un message avec timeout
                    message = await asyncio.wait_for(
                        self.message_queue.get(),
                        timeout=1.0
                    )

                    await self._handle_message(message)

                except asyncio.TimeoutError:
                    # Pas de message, continuer
                    continue
                except Exception as e:
                    logger.error(f"Erreur traitement message depuis queue: {e}")

        except asyncio.CancelledError:
            logger.info("📡 Tâche de traitement des messages annulée")
        except Exception as e:
            logger.error(f"Erreur dans la tâche de traitement: {e}")

    async def _handle_message(self, message: dict):
        """Gère un message reçu de Redis et diffuse via WebSocket"""
        try:
            message_type = message.get("type")
            message_data = message.get("data")

            if message_type == "document_processing":
                manager = get_manager()
                await manager.broadcast(message)

            elif message_type == "document_processing_error":
                manager = get_manager()
                await manager.broadcast(message)

        except Exception as e:
            logger.error(f"Erreur diffusion message: {e}")


_redis_listener: Optional[RedisListener] = None


def get_redis_listener() -> RedisListener:
    """Retourne l'instance globale du listener Redis"""
    global _redis_listener
    if _redis_listener is None:
        _redis_listener = RedisListener()
    return _redis_listener


async def start_redis_listener():
    """Démarre le listener Redis (appelé au startup de FastAPI)"""
    listener = get_redis_listener()
    await listener.start()


async def stop_redis_listener():
    """Arrête le listener Redis (appelé au shutdown de FastAPI)"""
    listener = get_redis_listener()
    await listener.stop()
