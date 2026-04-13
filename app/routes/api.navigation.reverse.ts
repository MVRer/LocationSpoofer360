import {
  getAutoReverse,
  setAutoReverse,
} from "../../server/simulation/navigation.js";
import type { Route } from "./+types/api.navigation.reverse";

export async function action({ request }: Route.ActionArgs) {
  const { enabled } = await request.json();
  setAutoReverse(!!enabled);
  return Response.json({ ok: true, autoReverse: getAutoReverse() });
}
