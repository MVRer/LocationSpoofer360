import { log } from "../../server/log.js";
import { simulateLocation } from "../../server/simulation/location.js";
import { startNavigationMode } from "../../server/simulation/movement.js";
import { startNavigation } from "../../server/simulation/navigation.js";
import type { Route } from "./+types/api.navigation.start";

export async function action({ request }: Route.ActionArgs) {
  const { waypoints } = await request.json();
  if (!Array.isArray(waypoints) || waypoints.length < 2) {
    return Response.json(
      { error: "waypoints must be an array of at least 2 coordinates" },
      { status: 400 },
    );
  }

  log.sim(
    `Navigation start: ${waypoints.length} waypoints | from ${waypoints[0].lat.toFixed(6)},${waypoints[0].lng.toFixed(6)} to ${waypoints[waypoints.length - 1].lat.toFixed(6)},${waypoints[waypoints.length - 1].lng.toFixed(6)}`,
  );

  await simulateLocation(waypoints[0]);
  const route = startNavigation(waypoints);
  startNavigationMode();

  return Response.json({ ok: true, totalPoints: route.totalPoints });
}
