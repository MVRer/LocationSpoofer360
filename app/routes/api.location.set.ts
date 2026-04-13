import { log } from "../../server/log.js";
import { simulateLocation } from "../../server/simulation/location.js";
import { setMoveStateManual } from "../../server/simulation/movement.js";
import type { Route } from "./+types/api.location.set";

function normalizeLng(lng: number): number {
  let n = ((lng + 180) % 360) - 180;
  if (n < -180) n += 360;
  return n;
}

export async function action({ request }: Route.ActionArgs) {
  const { lat, lng } = await request.json();
  if (typeof lat !== "number" || typeof lng !== "number") {
    return Response.json({ error: "lat and lng must be numbers" }, { status: 400 });
  }
  const normalizedLat = Math.max(-90, Math.min(90, lat));
  const normalizedLng = normalizeLng(lng);
  log.sim(`Set location: ${normalizedLat.toFixed(6)}, ${normalizedLng.toFixed(6)}`);
  setMoveStateManual();
  const result = await simulateLocation({ lat: normalizedLat, lng: normalizedLng });
  return Response.json(result, { status: result.ok ? 200 : 500 });
}
