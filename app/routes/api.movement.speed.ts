import { setSpeedKmh } from "../../server/simulation/movement.js";
import type { Route } from "./+types/api.movement.speed";

export async function action({ request }: Route.ActionArgs) {
  const { kmh } = await request.json();
  if (typeof kmh !== "number") {
    return Response.json({ error: "kmh must be a number" }, { status: 400 });
  }
  setSpeedKmh(kmh);
  return Response.json({ ok: true });
}
