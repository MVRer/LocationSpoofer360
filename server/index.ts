import { existsSync } from "node:fs";
import path from "node:path";
import { json, matchRoute } from "./api/router.js";
import { config } from "./config.js";
import { getDevices } from "./device/discovery.js";
import { log } from "./log.js";
import { getCurrentHeading, getCurrentLocation } from "./simulation/location.js";
import { getMoveState, getMoveType, getSpeedKmh, getTotalDistance } from "./simulation/movement.js";
import { isTunneldRunning } from "./tunnel/manager.js";
import { addClient, removeClient, send } from "./ws/handler.js";

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
  log.server("Shutting down...");
  stopDevicePolling();
  stopMovement();
  cleanupSimulation();
  if (wasTunneldStartedByUs()) {
    log.tunnel("Stopping tunneld we started...");
    await stopTunneld();
  }
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Production static file serving
const DIST_DIR = path.resolve(import.meta.dir, "../client/dist");

const _server = Bun.serve({
  port: config.serverPort,
  async fetch(req, server) {
    const url = new URL(req.url);

    // WebSocket upgrade
    if (url.pathname === "/ws") {
      if (server.upgrade(req)) return;
      return new Response("WebSocket upgrade failed", { status: 400 });
    }

    // CORS headers
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
      log.ws("Client connected");
    },
    close(ws) {
      removeClient(ws);
      log.ws("Client disconnected");
    },
    async message(ws, message) {
      try {
        const data = JSON.parse(String(message));
        if (data.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
        } else if (data.type === "init") {
          log.ws("Client requested state sync");
          send(ws, { type: "device:list", devices: getDevices() });
          send(ws, { type: "tunnel:status", running: await isTunneldRunning() });
          const loc = getCurrentLocation();
          if (loc) {
            send(ws, {
              type: "location:changed",
              lat: loc.lat,
              lng: loc.lng,
              heading: getCurrentHeading(),
            });
            send(ws, { type: "moveState:changed", state: getMoveState() });
            send(ws, { type: "moveType:changed", moveType: getMoveType() });
            send(ws, { type: "speed:changed", kmh: getSpeedKmh() });
            send(ws, { type: "distance:update", totalMeters: getTotalDistance() });
          }
        }
      } catch {
        // ignore malformed messages
      }
    },
  },
});

log.server(`Running on http://localhost:${config.serverPort}`);
