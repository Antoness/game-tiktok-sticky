import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

const WS_URL = 'ws://localhost:3001';
const RECONNECT_DELAY = 3000;

export function useGameSocket() {
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  const {
    handlePlayerJoin,
    setQueue,
    applyGiftHeal,
    resetGame,
    setTikTokStatus,
    addToQueue,
  } = useGameStore();

  const connect = () => {
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WS] Connected to backend');
        if (reconnectRef.current) clearTimeout(reconnectRef.current);
      };

      ws.onmessage = (event) => {
        try {
          const { type, payload } = JSON.parse(event.data);

          switch (type) {
            // Initial sync on connection
            case 'sync': {
              if (payload.queue?.length) {
                setQueue(payload.queue);
              }
              break;
            }

            // New player joined via TikTok event
            case 'player_join': {
              if (payload.player) {
                console.log(`[WS] 🎮 Penonton Asli Masuk: ${payload.player.username} via ${payload.player.source}`);
                handlePlayerJoin(payload.player);
              }
              break;
            }

            // Gift heal event
            case 'gift_heal': {
              applyGiftHeal({
                username: payload.username,
                hpBonus: payload.hpBonus,
              });
              break;
            }

            // Next challenger from server
            case 'next_challenger': {
              // Already handled by store logic
              break;
            }

            // Game reset
            case 'game_reset': {
              resetGame();
              break;
            }

            // TikTok connection status
            case 'tiktok_status': {
              setTikTokStatus(payload.connected);
              console.log('[TikTok]', payload.connected ? '✅ Connected' : `❌ Disconnected: ${payload.reason || payload.error}`);
              break;
            }

            default:
              break;
          }
        } catch (e) {
          console.error('[WS] Parse error:', e);
        }
      };

      ws.onclose = () => {
        console.warn('[WS] Disconnected. Reconnecting in 3s...');
        reconnectRef.current = setTimeout(connect, RECONNECT_DELAY);
      };

      ws.onerror = (err) => {
        console.error('[WS] Error:', err);
        ws.close();
      };
    } catch (e) {
      console.error('[WS] Failed to connect:', e);
      reconnectRef.current = setTimeout(connect, RECONNECT_DELAY);
    }
  };

  useEffect(() => {
    connect();
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  return wsRef;
}
