import { useState, useEffect, useCallback, useRef } from 'react';
import EventEmitter from 'eventemitter3';

/**
 * Hook pour gérer la connexion WebSocket et recevoir les mises à jour en temps réel
 *
 * @returns {Object} - { isConnected, lastMessage, eventEmitter, sendMessage }
 *
 * @example
 * const { isConnected, eventEmitter } = useWebSocket();
 *
 * useEffect(() => {
 *   const handlePagesClassified = (data) => {
 *     console.log('Pages classées:', data);
 *     // Mettre à jour l'état local
 *   };
 *
 *   eventEmitter.on('pages_classified', handlePagesClassified);
 *   return () => eventEmitter.off('pages_classified', handlePagesClassified);
 * }, [eventEmitter]);
 */
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
      // Déterminer l'URL du WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = import.meta.env.VITE_WS_URL || 'localhost:8000';
      const wsUrl = `${protocol}//${host}/ws/`;

      console.log('🔌 Connexion au WebSocket...', wsUrl);

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('✅ Connecté au WebSocket');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;

        // Envoyer un ping de test
        sendMessage({ type: 'ping', data: { timestamp: Date.now() } });
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📩 Message reçu:', message);

          setLastMessage(message);

          // Émettre l'événement correspondant
          if (message.type) {
            eventEmitterRef.current.emit(message.type, message.data);
          }

          // Émettre un événement générique pour tous les messages
          eventEmitterRef.current.emit('message', message);
        } catch (error) {
          console.error('❌ Erreur lors du parsing du message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('❌ Déconnecté du WebSocket', event.code, event.reason);
        setIsConnected(false);

        // Tentative de reconnexion automatique
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          console.log(`🔄 Tentative de reconnexion ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS}...`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, RECONNECT_DELAY);
        } else {
          console.error('❌ Nombre maximum de tentatives de reconnexion atteint');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ Erreur WebSocket:', error);
      };
    } catch (error) {
      console.error('❌ Erreur lors de la connexion WebSocket:', error);
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
      console.warn('⚠️ WebSocket non connecté, impossible d\'envoyer le message');
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
