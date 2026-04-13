import { isTunneldRunning } from "../../server/tunnel/manager.js";

export async function loader() {
  const running = await isTunneldRunning();
  return Response.json({ running });
}
