import { stopMovement } from "../../server/simulation/movement.js";

export async function action() {
  stopMovement();
  return Response.json({ ok: true });
}
