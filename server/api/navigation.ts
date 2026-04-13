import { post, json, error } from "./router.js";
import { startNavigation, stopNavigation, setAutoReverse, getAutoReverse } from "../simulation/navigation.js";
import { startNavigationMode, stopMovement } from "../simulation/movement.js";
import { simulateLocation } from "../simulation/location.js";

post("/api/navigation/start", async (req) => {
  const { waypoints } = await req.json();
  if (!Array.isArray(waypoints) || waypoints.length < 2) {
    return error("waypoints must be an array of at least 2 coordinates");
  }

  // Teleport to start of route
  await simulateLocation(waypoints[0]);

  // Start navigation
  const route = startNavigation(waypoints);
  startNavigationMode();

  return json({
    ok: true,
    totalPoints: route.totalPoints,
  });
});

post("/api/navigation/stop", async () => {
  stopMovement();
  return json({ ok: true });
});

post("/api/navigation/reverse", async (req) => {
  const { enabled } = await req.json();
  setAutoReverse(!!enabled);
  return json({ ok: true, autoReverse: getAutoReverse() });
});
