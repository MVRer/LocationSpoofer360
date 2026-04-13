import { setSpeedVariance } from "../../server/simulation/movement.js";
import type { Route } from "./+types/api.movement.variance";

export async function action({ request }: Route.ActionArgs) {
  const { enabled } = await request.json();
  setSpeedVariance(!!enabled);
  return Response.json({ ok: true });
}
