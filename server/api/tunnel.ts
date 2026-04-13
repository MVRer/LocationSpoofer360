import { isTunneldRunning, startTunneld, stopTunneld } from "../tunnel/manager.js";
import { get, json, post } from "./router.js";

get("/api/tunnel/status", async () => {
  const running = await isTunneldRunning();
  return json({ running });
});

post("/api/tunnel/start", async () => {
  const result = await startTunneld();
  return json(result, result.ok ? 200 : 500);
});

post("/api/tunnel/stop", async () => {
  const result = await stopTunneld();
  return json(result);
});
