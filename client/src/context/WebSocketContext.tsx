import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { WebSocketMessage } from "../types";

interface WebSocketContextType {
  connected: boolean;
  send: (message: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      // Clean up socket when user logs out
      if (socket) {
        socket.close();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    // Create WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
      
      // Authenticate with user ID
      ws.send(JSON.stringify({
        type: 'authenticate',
        userId: user.id,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        switch (message.type) {
          case 'queue_update':
            // Invalidate queue-related queries to trigger refetch
            queryClient.invalidateQueries({ queryKey: ['/api/queues/my'] });
            queryClient.invalidateQueries({ queryKey: ['/api/salons'] });
            
            if (message.salonId) {
              queryClient.invalidateQueries({ 
                queryKey: ['/api/salons', message.salonId, 'queues'] 
              });
            }
            break;
            
          case 'notification':
            // Show toast notification
            if (message.data?.title && message.data?.description) {
              toast({
                title: message.data.title,
                description: message.data.description,
              });
            }
            break;
            
          default:
            console.log('Unknown WebSocket message type:', message.type);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      setConnected(false);
      
      // Attempt to reconnect after a delay if it wasn't a clean close
      if (!event.wasClean && user) {
        setTimeout(() => {
          console.log('Attempting to reconnect WebSocket...');
          // The useEffect will handle recreation
        }, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
    };

    setSocket(ws);

    // Cleanup on unmount or user change
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Component unmounting');
      }
    };
  }, [user?.id]); // Only reconnect when user ID changes

  const send = (message: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected, cannot send message:', message);
    }
  };

  const value: WebSocketContextType = {
    connected,
    send,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
}
