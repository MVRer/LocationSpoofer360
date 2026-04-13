import { log } from "../log.js";
import { isTunneldRunning, startTunneld, stopTunneld } from "../tunnel/manager.js";
import { get, json, post } from "./router.js";

get("/api/tunnel/status", async () => {
  const running = await isTunneldRunning();
  log.tunnel(`Status check: ${running ? "running" : "not running"}`);
  return json({ running });
});

post("/api/tunnel/start", async () => {
  log.tunnel("Start requested");
  const result = await startTunneld();
  return json(result, result.ok ? 200 : 500);
});

post("/api/tunnel/stop", async () => {
  log.tunnel("Stop requested");
  const result = await stopTunneld();
  return json(result);
});
