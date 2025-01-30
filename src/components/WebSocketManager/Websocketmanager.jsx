import React, { createContext, useContext, useEffect, useState } from 'react';

const WebSocketContext = createContext(null);

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let websocket = null;
    let reconnectTimeout = null;

    const connect = () => {
      try {
        websocket = new WebSocket('ws://localhost:5000');

        websocket.onopen = () => {
          console.log('WebSocket Connected');
          setIsConnected(true);
          clearTimeout(reconnectTimeout);
        };

        websocket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          // Broadcast message to all subscribers
          window.dispatchEvent(new CustomEvent('websocket-message', { detail: data }));
        };

        websocket.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        websocket.onclose = () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
          
          // Attempt to reconnect after 5 seconds
          reconnectTimeout = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connect();
          }, 5000);
        };

        setWs(websocket);
      } catch (error) {
        console.error('WebSocket connection error:', error);
      }
    };

    connect();

    // Cleanup on unmount
    return () => {
      if (websocket) {
        websocket.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ ws, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};