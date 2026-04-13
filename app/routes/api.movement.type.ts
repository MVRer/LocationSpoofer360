import { setMoveType } from "../../server/simulation/movement.js";
import type { Route } from "./+types/api.movement.type";

export async function action({ request }: Route.ActionArgs) {
  const { type } = await request.json();
  if (!["walk", "cycle", "drive"].includes(type)) {
    return Response.json(
      { error: "type must be 'walk', 'cycle', or 'drive'" },
      { status: 400 },
    );
  }
  setMoveType(type);
  return Response.json({ ok: true });
}
