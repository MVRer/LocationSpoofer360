import { setMoveStateManual, step } from "../../server/simulation/movement.js";

export async function action() {
  setMoveStateManual();
  const result = await step();
  if (!result) {
    return Response.json(
      { error: "No current location. Set a location first." },
      { status: 400 },
    );
  }
  return Response.json({ ok: true, lat: result.lat, lng: result.lng });
}
