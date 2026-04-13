import { log } from "../../server/log.js";
import { startTunneld } from "../../server/tunnel/manager.js";

export async function action() {
  log.tunnel("Start requested");
  const result = await startTunneld();
  return Response.json(result, { status: result.ok ? 200 : 500 });
}
