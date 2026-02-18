import { useState, useEffect, useCallback, useRef } from 'react';
import EventEmitter from 'eventemitter3';


const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const eventEmitterRef = useRef(new EventEmitter());
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 3000; // 3 secondes

  /**
   * Connecte au WebSocket
   */
  const connect = useCallback(() => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = import.meta.env.VITE_WS_URL || 'localhost:8000';
      const wsUrl = `${protocol}//${host}/ws/`;

      console.log('🔌 Tentative de connexion WebSocket:', wsUrl);

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket connecté:', wsUrl);
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        sendMessage({ type: 'ping', data: { timestamp: Date.now() } });
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          console.log('📨 WebSocket message reçu:', message);

          setLastMessage(message);

          if (message.type) {
            console.log('📢 Emit event:', message.type, message.data);
            eventEmitterRef.current.emit(message.type, message.data);
          }

          eventEmitterRef.current.emit('message', message);
        } catch (error) {
          console.error('❌ Erreur parsing WebSocket:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('❌ WebSocket déconnecté:', event.code, event.reason);
        setIsConnected(false);

        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;

          console.log(`🔄 Tentative reconnexion ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS} dans ${RECONNECT_DELAY}ms`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, RECONNECT_DELAY);
        } else {
          console.error('❌ Max tentatives reconnexion atteint');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket erreur:', error);
      };
    } catch (error) {
      console.error('❌ Erreur connexion WebSocket:', error);
    }
  }, []);

  /**
   * Déconnecte le WebSocket
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  /**
   * Envoie un message au serveur WebSocket
   */
  const sendMessage = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
    }
  }, []);

  // Se connecter au montage
  useEffect(() => {
    connect();

    return () => {
      disconnect();
      // Nettoyer tous les écouteurs d'événements
      eventEmitterRef.current.removeAllListeners();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    eventEmitter: eventEmitterRef.current,
    sendMessage,
    connect,
    disconnect
  };
};

export default useWebSocket;
