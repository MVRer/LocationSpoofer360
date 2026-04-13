import { log } from "../log.js";
import { resetLocation, simulateLocation } from "../simulation/location.js";
import { setMoveStateManual } from "../simulation/movement.js";
import { error, json, post } from "./router.js";

function normalizeLng(lng: number): number {
  let n = ((lng + 180) % 360) - 180;
  if (n < -180) n += 360;
  return n;
}

post("/api/location/set", async (req) => {
  const body = await req.json();
  const { lat, lng } = body;
  if (typeof lat !== "number" || typeof lng !== "number") {
    return error("lat and lng must be numbers");
  }
  const normalizedLat = Math.max(-90, Math.min(90, lat));
  const normalizedLng = normalizeLng(lng);
  log.sim(`Set location: ${normalizedLat.toFixed(6)}, ${normalizedLng.toFixed(6)}`);
  setMoveStateManual();
  const result = await simulateLocation({ lat: normalizedLat, lng: normalizedLng });
  return json(result, result.ok ? 200 : 500);
});

post("/api/location/reset", async () => {
  log.sim("Reset location");
  const result = await resetLocation();
  return json(result);
});
