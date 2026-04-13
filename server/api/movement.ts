import { setCurrentHeading } from "../simulation/location.js";
import {
  setMoveStateManual,
  setMoveType,
  setSpeedKmh,
  setSpeedVariance,
  startAutoMove,
  step,
  stopAutoMove,
} from "../simulation/movement.js";
import { error, json, post } from "./router.js";

post("/api/movement/step", async () => {
  setMoveStateManual();
  const result = await step();
  if (!result) {
    return error("No current location. Set a location first.");
  }
  return json({ ok: true, lat: result.lat, lng: result.lng });
});

post("/api/movement/heading", async (req) => {
  const { degrees } = await req.json();
  if (typeof degrees !== "number") {
    return error("degrees must be a number");
  }
  setCurrentHeading(degrees);
  return json({ ok: true });
});

post("/api/movement/mode", async (req) => {
  const { mode } = await req.json();
  if (mode === "auto") {
    startAutoMove();
  } else if (mode === "manual") {
    stopAutoMove();
  } else {
    return error("mode must be 'auto' or 'manual'");
  }
  return json({ ok: true });
});

post("/api/movement/type", async (req) => {
  const { type } = await req.json();
  if (!["walk", "cycle", "drive"].includes(type)) {
    return error("type must be 'walk', 'cycle', or 'drive'");
  }
  setMoveType(type);
  return json({ ok: true });
});

post("/api/movement/speed", async (req) => {
  const { kmh } = await req.json();
  if (typeof kmh !== "number") {
    return error("kmh must be a number");
  }
  setSpeedKmh(kmh);
  return json({ ok: true });
});

post("/api/movement/variance", async (req) => {
  const { enabled } = await req.json();
  setSpeedVariance(!!enabled);
  return json({ ok: true });
});
