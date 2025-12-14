import { useEffect, useRef, useState, useCallback } from "react";

interface UseWebSocketProps {
  onMessage?: (data: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

export function useWebSocket({ onMessage, onOpen, onClose, onError }: UseWebSocketProps) {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  const reconnectInterval = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      // Use location.host which includes hostname and port (if present).
      // This avoids cases where `window.location.port` is undefined or
      // when the environment proxy rewrites the host.
      const hostWithPort = window.location.host;
      const wsUrl = `${protocol}//${hostWithPort}/ws`;
      
      console.log("Connecting to WebSocket:", wsUrl);
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        setReconnectAttempts(0);
        if (reconnectInterval.current) {
          clearInterval(reconnectInterval.current);
        }
        onOpen?.();
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.current.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
        onClose?.();

        // Attempt to reconnect
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectInterval.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, Math.pow(2, reconnectAttempts) * 1000); // Exponential backoff
        }
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        onError?.(error);
      };
    } catch (error) {
      console.error("Error creating WebSocket connection:", error);
    }
  }, [onMessage, onOpen, onClose, onError, reconnectAttempts]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectInterval.current) {
        clearInterval(reconnectInterval.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const sendMessage = useCallback((data: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    } else {
      console.warn("WebSocket is not connected");
    }
  }, []);

  return {
    sendMessage,
    isConnected,
    reconnectAttempts,
  };
}
