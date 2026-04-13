import type { Coord } from "../../shared/types.js";
import { broadcast } from "../ws/handler.js";
import { getCurrentLocation, setCurrentHeading } from "./location.js";
import { bearing, destinationPoint, haversineDistance } from "./movement.js";
import { NavigationRoute } from "./route.js";

let currentRoute: NavigationRoute | null = null;
let autoReverse = false;

export function getNavigation(): NavigationRoute | null {
  return currentRoute;
}

export function isNavigating(): boolean {
  return currentRoute !== null;
}

export function setAutoReverse(enabled: boolean) {
  autoReverse = enabled;
}

export function getAutoReverse(): boolean {
  return autoReverse;
}

export function startNavigation(waypoints: Coord[]): NavigationRoute {
  currentRoute = new NavigationRoute(waypoints);
  broadcastProgress();
  return currentRoute;
}

export function stopNavigation() {
  currentRoute = null;
}

export function advanceNavigation(speedMs: number, deltaSeconds: number): Coord | null {
  if (!currentRoute) return null;

  const current = getCurrentLocation();
  if (!current) return null;

  const target = currentRoute.currentTarget;
  if (!target) {
    // Route finished
    if (autoReverse) {
      currentRoute = currentRoute.reverse();
      broadcast({ type: "navigation:finished", autoReversed: true });
      broadcastProgress();
      return advanceNavigation(speedMs, deltaSeconds);
    }
    broadcast({ type: "navigation:finished", autoReversed: false });
    currentRoute = null;
    return null;
  }

  const distanceToTarget = haversineDistance(current, target);
  const stepDistance = speedMs * deltaSeconds;

  // Update heading to point toward target
  const headingToTarget = bearing(current, target);
  setCurrentHeading(headingToTarget);

  if (stepDistance >= distanceToTarget) {
    // We've reached or passed the current waypoint
    currentRoute.advance();
    broadcastProgress();

    // If there's remaining distance, continue to next waypoint
    const remaining = stepDistance - distanceToTarget;
    if (remaining > 0 && !currentRoute.isFinished) {
      const nextTarget = currentRoute.currentTarget;
      if (nextTarget) {
        const nextHeading = bearing(target, nextTarget);
        setCurrentHeading(nextHeading);
        return destinationPoint(target, nextHeading, remaining);
      }
    }
    return target;
  }

  // Move toward target
  return destinationPoint(current, headingToTarget, stepDistance);
}

function broadcastProgress() {
  if (!currentRoute) return;
  broadcast({
    type: "navigation:progress",
    traveled: currentRoute.traveledCoordinates,
    upcoming: currentRoute.upcomingCoordinates,
    progress: currentRoute.progress,
  });
}
