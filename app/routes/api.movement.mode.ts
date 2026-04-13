import { startAutoMove, stopAutoMove } from "../../server/simulation/movement.js";
import type { Route } from "./+types/api.movement.mode";

export async function action({ request }: Route.ActionArgs) {
  const { mode } = await request.json();
  if (mode === "auto") {
    startAutoMove();
  } else if (mode === "manual") {
    stopAutoMove();
  } else {
    return Response.json({ error: "mode must be 'auto' or 'manual'" }, { status: 400 });
  }
  return Response.json({ ok: true });
}
