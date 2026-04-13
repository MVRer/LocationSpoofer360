import type { ServerWebSocket } from "bun";
import type { ServerMessage } from "../../shared/protocol.js";

const clients = new Set<ServerWebSocket<unknown>>();

export function addClient(ws: ServerWebSocket<unknown>) {
  clients.add(ws);
}

export function removeClient(ws: ServerWebSocket<unknown>) {
  clients.delete(ws);
}

export function broadcast(message: ServerMessage) {
  const data = JSON.stringify(message);
  for (const ws of clients) {
    ws.send(data);
  }
}

export function getClientCount(): number {
  return clients.size;
}
