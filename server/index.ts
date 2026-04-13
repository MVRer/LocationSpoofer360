import { config } from "./config.js";
import { matchRoute, json } from "./api/router.js";
import { addClient, removeClient } from "./ws/handler.js";

// Register API routes
import "./api/devices.js";
import "./api/tunnel.js";
import "./api/location.js";
import "./api/movement.js";
import "./api/navigation.js";
import "./api/gpx.js";
import "./api/settings.js";

// Start device polling
import { startDevicePolling, stopDevicePolling } from "./device/discovery.js";
import { cleanup as cleanupSimulation } from "./simulation/location.js";
import { stopMovement } from "./simulation/movement.js";
import { stopTunneld, wasTunneldStartedByUs } from "./tunnel/manager.js";

startDevicePolling();

// Cleanup on exit
async function shutdown() {
  console.log("\n[server] Shutting down...");
  stopDevicePolling();
  stopMovement();
  cleanupSimulation();
  if (wasTunneldStartedByUs()) {
    console.log("[server] Stopping tunneld we started...");
    await stopTunneld();
  }
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

const server = Bun.serve({
  port: config.serverPort,
  async fetch(req, server) {
    const url = new URL(req.url);

    // WebSocket upgrade
    if (url.pathname === "/ws") {
      if (server.upgrade(req)) return;
      return new Response("WebSocket upgrade failed", { status: 400 });
    }

    // CORS headers for dev
    const corsHeaders: Record<string, string> = {
      "Access-Control-Allow-Origin": config.clientOrigin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // API routing
    const match = matchRoute(req);
    if (match) {
      const response = await match.handler(req, match.params);
      // Add CORS headers to response
      for (const [key, value] of Object.entries(corsHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }

    return json({ error: "Not found" }, 404);
  },
  websocket: {
    open(ws) {
      addClient(ws);
      console.log("[ws] Client connected");
    },
    close(ws) {
      removeClient(ws);
      console.log("[ws] Client disconnected");
    },
    message(ws, message) {
      try {
        const data = JSON.parse(String(message));
        if (data.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
        }
      } catch {
        // ignore malformed messages
      }
    },
  },
});

console.log(`[server] LocationSpoofer360 running on http://localhost:${config.serverPort}`);
