"""
Route WebSocket pour les mises à jour en temps réel
"""
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from ..websocket import get_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws", tags=["WebSocket"])


@router.websocket("/")
async def websocket_endpoint(
    websocket: WebSocket,
    client_id: str = Query(None)
):
    """
    Endpoint WebSocket principal pour les mises à jour en temps réel

    Se connecter à: ws://localhost:8000/ws

   
    Exemple de message reçu:
        {
            "type": "pages_classified",
            "data": {
                "document_id": 123,
                "pages": [1, 2, 3],
                "type_id": 5,
                "type_name": "Permis de Conduire"
            }
        }
    """
    manager = get_manager()

    # Générer un ID client si non fourni
    if not client_id:
        import uuid
        client_id = str(uuid.uuid4())[:8]

    await manager.connect(websocket, client_id)

    try:
        # Envoyer un message de bienvenue
        await websocket.send_json({
            "type": "connected",
            "data": {
                "client_id": client_id,
                "message": "Connecté au serveur WebSocket Kairos WebScan"
            }
        })

        while True:
            try:
                data = await websocket.receive_json()

                if data.get("type") == "ping":
                    await websocket.send_json({
                        "type": "pong",
                        "data": {"timestamp": data.get("timestamp")}
                    })

                elif data.get("type") == "subscribe":
                    await websocket.send_json({
                        "type": "subscribed",
                        "data": {"events": data.get("events", "all")}
                    })

            except WebSocketDisconnect:
                logger.info(f"Client {client_id} déconnecté")
                break
            except Exception as e:
                logger.error(f"Erreur lors de la réception du message: {e}")
                try:
                    await websocket.send_json({
                        "type": "error",
                        "data": {"message": "Invalid message format"}
                    })
                except:
                    break

    except WebSocketDisconnect:
        logger.info(f"WebSocket déconnecté pour le client {client_id}")
    except Exception as e:
        logger.error(f"Erreur dans la connexion WebSocket: {e}")
    finally:
        manager.disconnect(websocket)


@router.get("/connections")
async def get_connections_info():
    """
    Retourne des informations sur les connexions WebSocket actives

    Returns:
        {
            "active_connections": int,
            "connections": List[dict]
        }
    """
    manager = get_manager()
    return {
        "active_connections": manager.get_connection_count(),
        "connections": manager.get_connection_info()
    }


@router.post("/broadcast")
async def broadcast_test_message(message: dict):
    """
    Endpoint de test pour envoyer un message broadcast à tous les clients connectés

    Args:
        message: Message à diffuser

    Returns:
        Confirmation de l'envoi
    """
    manager = get_manager()
    await manager.broadcast({
        "type": "test",
        "data": message
    })
    return {
        "message": "Message broadcast envoyé",
        "connections": manager.get_connection_count()
    }
