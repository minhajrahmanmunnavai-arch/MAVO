import { io } from "socket.io-client";
import { api } from "./auth.api.js";

const listeners = new Set();
const connectionListeners = new Set();
let socket;
let enabled = false;
let connectionGeneration = 0;
let activeChatJoinPayload = null;

function notifyListeners(update) {
  listeners.forEach((listener) => {
    try {
      listener(update);
    } catch (error) {
      console.error("Live update listener failed:", error);
    }
  });
}

function createSocket() {
  socket = io(api.defaults.baseURL || window.location.origin, {
    autoConnect: false,
    auth: (callback) => {
      const requestGeneration = connectionGeneration;
      api.get("/api/auth/socket-token")
        .then(({ data }) => {
          if (
            !enabled ||
            requestGeneration !== connectionGeneration ||
            typeof data?.token !== "string"
          ) {
            callback({});
            return;
          }
          callback({ token: data.token });
        })
        .catch((error) => {
          console.error("Unable to obtain realtime authentication:", error);
          callback({});
        });
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
    timeout: 10000,
    withCredentials: true,
  });

  socket.on("live:update", (update) => {
    if (!update || typeof update.type !== "string") return;
    notifyListeners(update);
  });

  socket.on("connect", () => {
    if (activeChatJoinPayload) {
      socket.emit("chat:join", activeChatJoinPayload, () => {});
    }
    connectionListeners.forEach((listener) => listener());
  });
}

export function resumeLiveUpdates() {
  enabled = true;
  connectionGeneration += 1;
  if (!socket) createSocket();
  socket.connect();
}

export function pauseLiveUpdates() {
  enabled = false;
  connectionGeneration += 1;
  activeChatJoinPayload = null;
  socket?.disconnect();
}

export function subscribeToLiveUpdates(listener) {
  listeners.add(listener);
  if (!enabled) resumeLiveUpdates();

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      pauseLiveUpdates();
    }
  };
}

export function subscribeToRealtimeConnection(listener) {
  connectionListeners.add(listener);
  return () => connectionListeners.delete(listener);
}

export function joinRealtimeChat(payload) {
  activeChatJoinPayload = payload;
  if (socket?.connected) socket.emit("chat:join", payload, () => {});
}

export function leaveRealtimeChat() {
  if (socket?.connected && activeChatJoinPayload) {
    socket.emit("chat:leave", activeChatJoinPayload);
  }
  activeChatJoinPayload = null;
}
