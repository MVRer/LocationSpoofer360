import { setCurrentHeading } from "../../server/simulation/location.js";
import type { Route } from "./+types/api.movement.heading";

export async function action({ request }: Route.ActionArgs) {
  const { degrees } = await request.json();
  if (typeof degrees !== "number") {
    return Response.json({ error: "degrees must be a number" }, { status: 400 });
  }
  setCurrentHeading(degrees);
  return Response.json({ ok: true });
}
