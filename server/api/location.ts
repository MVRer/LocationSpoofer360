import { resetLocation, simulateLocation } from "../simulation/location.js";
import { setMoveStateManual } from "../simulation/movement.js";
import { error, json, post } from "./router.js";

post("/api/location/set", async (req) => {
  const body = await req.json();
  const { lat, lng } = body;
  if (typeof lat !== "number" || typeof lng !== "number") {
    return error("lat and lng must be numbers");
  }
  setMoveStateManual();
  const result = await simulateLocation({ lat, lng });
  return json(result, result.ok ? 200 : 500);
});

post("/api/location/reset", async () => {
  const result = resetLocation();
  return json(result);
});
