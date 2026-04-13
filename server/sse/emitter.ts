import type { ServerMessage } from "../../shared/protocol.js";

interface SSEClient {
  id: number;
  controller: ReadableStreamDefaultController;
  keepAliveTimer: ReturnType<typeof setInterval>;
}

let nextId = 0;
const clients = new Set<SSEClient>();
const encoder = new TextEncoder();

export function createSSEStream(): { response: Response; client: SSEClient } {
  let client: SSEClient;

  const stream = new ReadableStream({
    start(controller) {
      client = {
        id: nextId++,
        controller,
        keepAliveTimer: setInterval(() => {
          try {
            controller.enqueue(encoder.encode(": keepalive\n\n"));
          } catch {
            removeClient(client);
          }
        }, 30_000),
      };
      clients.add(client);
    },
    cancel() {
      removeClient(client!);
    },
  });

  const response = new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });

  return { response, client: client! };
}

export function removeClient(client: SSEClient) {
  clearInterval(client.keepAliveTimer);
  clients.delete(client);
  try {
    client.controller.close();
  } catch {
    // already closed
  }
}

export function broadcast(message: ServerMessage) {
  const data = encoder.encode(`data: ${JSON.stringify(message)}\n\n`);
  for (const client of clients) {
    try {
      client.controller.enqueue(data);
    } catch {
      removeClient(client);
    }
  }
}

export function send(client: SSEClient, message: ServerMessage) {
  try {
    client.controller.enqueue(
      encoder.encode(`data: ${JSON.stringify(message)}\n\n`),
    );
  } catch {
    removeClient(client);
  }
}

export function getClientCount(): number {
  return clients.size;
}
