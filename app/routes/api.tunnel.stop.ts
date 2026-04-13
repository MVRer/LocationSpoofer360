import { log } from "../../server/log.js";
import { stopTunneld } from "../../server/tunnel/manager.js";

export async function action() {
  log.tunnel("Stop requested");
  const result = await stopTunneld();
  return Response.json(result);
}
