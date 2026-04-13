import { log } from "../log.js";
import { isTunneldRunning, startTunneld, stopTunneld } from "../tunnel/manager.js";
import { get, json, post } from "./router.js";

// Status is polled every 3s by the client -- don't log every check
get("/api/tunnel/status", async () => {
  const running = await isTunneldRunning();
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
