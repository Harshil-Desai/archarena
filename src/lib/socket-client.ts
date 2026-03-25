import { io, Socket } from "socket.io-client";
import { SemanticGraph } from "@/types";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      transports: ["websocket"],
      autoConnect: false,
    });
  }
  return socket;
}

// Called when user pauses drawing (debounced 1.5s)
export function emitGraphUpdate(sessionId: string, graph: SemanticGraph) {
  getSocket().emit("canvas:update", { sessionId, graph });
}

// Server pushes a background hint down this channel
export function onHintReceived(cb: (hint: string) => void) {
  getSocket().on("hint:new", (data) => cb(data.hint));
}

export function joinSession(sessionId: string) {
  const s = getSocket();
  s.connect();
  s.emit("session:join", { sessionId });
}