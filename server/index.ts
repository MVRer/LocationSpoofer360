import { existsSync } from "node:fs";
import path from "node:path";
import { json, matchRoute } from "./api/router.js";
import { config } from "./config.js";
import { addClient, removeClient } from "./ws/handler.js";

// Register API routes
import "./api/devices.js";
import "./api/tunnel.js";
import "./api/location.js";
import "./api/movement.js";
import "./api/navigation.js";
import "./api/gpx.js";
import "./api/settings.js";
import "./api/recentLocations.js";

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

// Production static file serving
const DIST_DIR = path.resolve(import.meta.dir, "../client/dist");
const _isDev =
  process.env.NODE_ENV !== "production" &&
  existsSync(path.resolve(import.meta.dir, "../client/node_modules/.vite"));

const _server = Bun.serve({
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
      "Access-Control-Allow-Origin": "*",
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
      for (const [key, value] of Object.entries(corsHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }

    // Serve static files from dist/ in production
    if (existsSync(DIST_DIR)) {
      let filePath = path.join(DIST_DIR, url.pathname);

      // If path is a directory or doesn't exist, serve index.html (SPA fallback)
      if (!existsSync(filePath) || url.pathname === "/") {
        filePath = path.join(DIST_DIR, "index.html");
      }

      if (existsSync(filePath)) {
        return new Response(Bun.file(filePath));
      }
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
