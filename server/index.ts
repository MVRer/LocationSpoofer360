import { existsSync } from "node:fs";
import path from "node:path";
import { createRequestHandler } from "@react-router/node";
import { ensureBootstrap } from "./bootstrap.js";
import { config } from "./config.js";
import { log } from "./log.js";

ensureBootstrap();

const BUILD_DIR = path.resolve(import.meta.dir, "../build");
const CLIENT_DIR = path.join(BUILD_DIR, "client");

const build = await import("../build/server/index.js");
const handler = createRequestHandler(build);

Bun.serve({
  port: config.serverPort,
  async fetch(req) {
    const url = new URL(req.url);

    // Serve static files from build/client/
    if (url.pathname !== "/" && !url.pathname.startsWith("/api/")) {
      const filePath = path.join(CLIENT_DIR, url.pathname);
      if (existsSync(filePath)) {
        return new Response(Bun.file(filePath));
      }
    }

    // Everything else through React Router
    return handler(req);
  },
});

log.server(`Running on http://localhost:${config.serverPort}`);
