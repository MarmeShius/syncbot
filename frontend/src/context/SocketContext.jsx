import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./useAuth";
import { SocketContext } from "./SocketContext";

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("syncbot_token");
    const rawApi = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const serverUrl = rawApi.replace(/\/api\/?$/, "");

    const newSocket = io(serverUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      setConnected(true);
    });

    newSocket.on("disconnect", () => {
      setConnected(false);
    });

    const timer = setTimeout(() => {
      setSocket(newSocket);
    }, 0);

    return () => {
      clearTimeout(timer);
      newSocket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

