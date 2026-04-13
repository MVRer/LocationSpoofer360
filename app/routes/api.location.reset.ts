import { log } from "../../server/log.js";
import { resetLocation } from "../../server/simulation/location.js";

export async function action() {
  log.sim("Reset location");
  const result = await resetLocation();
  return Response.json(result);
}
