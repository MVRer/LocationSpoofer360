import { get, post, json } from "./router.js";
import { isTunneldRunning, startTunneld, stopTunneld } from "../tunnel/manager.js";

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
