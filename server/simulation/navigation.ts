import type { Coord } from "../../shared/types.js";
import { broadcast } from "../ws/handler.js";
import { setCurrentHeading } from "./location.js";
import { bearing, destinationPoint, haversineDistance } from "./movement.js";
import { NavigationRoute } from "./route.js";

let currentRoute: NavigationRoute | null = null;
let autoReverse = false;
// Track the clean (non-jittered) position along the route
let cleanPosition: Coord | null = null;

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
  cleanPosition = waypoints[0] ?? null;
  broadcastProgress();
  return currentRoute;
}

export function stopNavigation() {
  currentRoute = null;
  cleanPosition = null;
}

export function advanceNavigation(speedMs: number, deltaSeconds: number): Coord | null {
  if (!currentRoute || !cleanPosition) return null;

  const target = currentRoute.currentTarget;
  if (!target) {
    // Route finished
    if (autoReverse) {
      currentRoute = currentRoute.reverse();
      cleanPosition = currentRoute.currentPosition;
      broadcast({ type: "navigation:finished", autoReversed: true });
      broadcastProgress();
      return advanceNavigation(speedMs, deltaSeconds);
    }
    broadcast({ type: "navigation:finished", autoReversed: false });
    currentRoute = null;
    cleanPosition = null;
    return null;
  }

  // Use CLEAN position for route-following math (no jitter drift)
  const distanceToTarget = haversineDistance(cleanPosition, target);
  const stepDistance = speedMs * deltaSeconds;

  const headingToTarget = bearing(cleanPosition, target);
  setCurrentHeading(headingToTarget);

  let result: Coord;

  if (stepDistance >= distanceToTarget) {
    currentRoute.advance();

    const remaining = stepDistance - distanceToTarget;
    if (remaining > 0 && !currentRoute.isFinished) {
      const nextTarget = currentRoute.currentTarget;
      if (nextTarget) {
        const nextHeading = bearing(target, nextTarget);
        setCurrentHeading(nextHeading);
        result = destinationPoint(target, nextHeading, remaining);
      } else {
        result = target;
      }
    } else {
      result = target;
    }
  } else {
    result = destinationPoint(cleanPosition, headingToTarget, stepDistance);
  }

  // Update clean position (before organic transforms are applied by caller)
  cleanPosition = result;

  broadcastProgress();
  return result;
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
