import {
  addRecentLocation,
  clearRecentLocations,
  loadRecentLocations,
} from "../../server/recentLocations.js";
import type { Route } from "./+types/api.recent-locations";

export function loader() {
  return Response.json(loadRecentLocations());
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method === "DELETE") {
    clearRecentLocations();
    return Response.json({ ok: true });
  }

  const body = await request.json();
  const updated = addRecentLocation(body);
  return Response.json(updated);
}
