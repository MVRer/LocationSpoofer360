import {
  AUTO_MOVE_INTERVAL_MS,
  DEFAULT_SPEEDS,
  kmhToMs,
  SPEED_VARIANCE_MAX,
  SPEED_VARIANCE_MIN,
} from "../../shared/constants.js";
import type { Coord, MoveState, MoveType } from "../../shared/types.js";
import { broadcast } from "../ws/handler.js";
import { getCurrentHeading, getCurrentLocation, setCurrentHeading, simulateLocation } from "./location.js";
import { getClientCount } from "../ws/handler.js";
import { advanceNavigation, getNavigation, stopNavigation } from "./navigation.js";
import { log } from "../log.js";
import { applyOrganic, computeSmoothSpeed, resetOrganicState } from "./organic.js";

let moveType: MoveType = "walk";
let moveState: MoveState = "idle";
let stepCounter = 0;
let speedKmh = DEFAULT_SPEEDS.walk;
let speedVarianceEnabled = false;
let organicEnabled = true;
let totalDistanceMeters = 0;
let autoMoveTimer: ReturnType<typeof setInterval> | null = null;

// --- Getters / Setters ---

export function getMoveType(): MoveType {
  return moveType;
}

export function setMoveType(type: MoveType) {
  moveType = type;
  speedKmh = DEFAULT_SPEEDS[type];
  broadcast({ type: "moveType:changed", moveType: type });
  broadcast({ type: "speed:changed", kmh: speedKmh });
}

export function getMoveState(): MoveState {
  return moveState;
}

export function getSpeedKmh(): number {
  return speedKmh;
}

export function setSpeedKmh(kmh: number) {
  speedKmh = Math.max(1, Math.min(256, kmh));
  broadcast({ type: "speed:changed", kmh: speedKmh });
}

export function setSpeedVariance(enabled: boolean) {
  speedVarianceEnabled = enabled;
}

export function setOrganicMovement(enabled: boolean) {
  organicEnabled = enabled;
  if (!enabled) resetOrganicState();
}

export function getTotalDistance(): number {
  return totalDistanceMeters;
}

export function resetTotalDistance() {
  totalDistanceMeters = 0;
  broadcast({ type: "distance:update", totalMeters: 0 });
}

// --- Geo Math ---

const EARTH_RADIUS = 6371000; // meters

export function haversineDistance(a: Coord, b: Coord): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * EARTH_RADIUS * Math.asin(Math.sqrt(h));
}

export function bearing(from: Coord, to: Coord): number {
  const dLng = toRad(to.lng - from.lng);
  const fromLat = toRad(from.lat);
  const toLat = toRad(to.lat);
  const y = Math.sin(dLng) * Math.cos(toLat);
  const x =
    Math.cos(fromLat) * Math.sin(toLat) - Math.sin(fromLat) * Math.cos(toLat) * Math.cos(dLng);
  return ((toDeg(Math.atan2(y, x)) % 360) + 360) % 360;
}

export function destinationPoint(from: Coord, bearingDeg: number, distanceMeters: number): Coord {
  const d = distanceMeters / EARTH_RADIUS;
  const brng = toRad(bearingDeg);
  const lat1 = toRad(from.lat);
  const lng1 = toRad(from.lng);
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng),
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
    );
  return { lat: toDeg(lat2), lng: toDeg(lng2) };
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

// --- Movement ---

const deltaSeconds = AUTO_MOVE_INTERVAL_MS / 1000;

function getEffectiveSpeed(): number {
  let targetSpeed = kmhToMs(speedKmh);
  if (speedVarianceEnabled) {
    const factor = SPEED_VARIANCE_MIN + Math.random() * (SPEED_VARIANCE_MAX - SPEED_VARIANCE_MIN);
    targetSpeed *= factor;
  }
  if (organicEnabled) {
    return computeSmoothSpeed(targetSpeed, deltaSeconds, moveType);
  }
  return targetSpeed;
}

export async function step(): Promise<Coord | null> {
  const current = getCurrentLocation();
  if (!current) return null;

  stepCounter++;
  const nav = getNavigation();

  if (nav && moveState === "navigation") {
    const speed = getEffectiveSpeed();
    const result = advanceNavigation(speed, deltaSeconds);
    if (!result) {
      // Navigation finished — stop everything
      log.sim(`Navigation complete at step #${stepCounter}`);
      if (autoMoveTimer) {
        clearInterval(autoMoveTimer);
        autoMoveTimer = null;
      }
      moveState = "idle";
      broadcast({ type: "moveState:changed", state: "idle" });
      return current;
    }

    let finalCoord = result;
    if (organicEnabled) {
      const headingNow = getCurrentHeading();
      const organic = applyOrganic(result, headingNow, deltaSeconds);
      finalCoord = organic.coord;
      setCurrentHeading(organic.bearing);
    }

    const distance = haversineDistance(current, finalCoord);
    totalDistanceMeters += distance;
    broadcast({ type: "distance:update", totalMeters: totalDistanceMeters });

    if (stepCounter % 10 === 0) {
      log.sim(`step #${stepCounter} | nav ${(nav.progress * 100).toFixed(1)}% | ${finalCoord.lat.toFixed(6)}, ${finalCoord.lng.toFixed(6)} | ${(speed * 3.6).toFixed(1)} km/h | ${distance.toFixed(1)}m | ws:${getClientCount()}`);
    }

    await simulateLocation(finalCoord);
    return finalCoord;
  }

  // Manual/auto: move in current heading direction
  const speed = getEffectiveSpeed();
  const distance = speed * deltaSeconds;
  let headingDeg = getCurrentHeading();

  let next: Coord;
  if (organicEnabled) {
    const { coord: organicDest, bearing: wobbledHeading } = applyOrganic(
      destinationPoint(current, headingDeg, distance),
      headingDeg,
      deltaSeconds,
    );
    setCurrentHeading(wobbledHeading);
    next = organicDest;
  } else {
    next = destinationPoint(current, headingDeg, distance);
  }

  const actualDist = haversineDistance(current, next);
  totalDistanceMeters += actualDist;
  broadcast({ type: "distance:update", totalMeters: totalDistanceMeters });

  if (stepCounter % 10 === 0) {
    log.sim(`step #${stepCounter} | ${moveState} | ${next.lat.toFixed(6)}, ${next.lng.toFixed(6)} | ${(speed * 3.6).toFixed(1)} km/h | heading ${headingDeg.toFixed(0)}°`);
  }

  await simulateLocation(next);
  return next;
}

export function startAutoMove() {
  if (autoMoveTimer) return;
  moveState = "auto";
  broadcast({ type: "moveState:changed", state: "auto" });
  autoMoveTimer = setInterval(() => step(), AUTO_MOVE_INTERVAL_MS);
}

export function stopAutoMove() {
  if (autoMoveTimer) {
    clearInterval(autoMoveTimer);
    autoMoveTimer = null;
  }
  if (moveState === "auto") {
    moveState = "manual";
    broadcast({ type: "moveState:changed", state: "manual" });
  }
}

export function startNavigationMode() {
  if (autoMoveTimer) {
    clearInterval(autoMoveTimer);
  }
  resetOrganicState();
  moveState = "navigation";
  broadcast({ type: "moveState:changed", state: "navigation" });
  autoMoveTimer = setInterval(() => step(), AUTO_MOVE_INTERVAL_MS);
}

export function stopMovement() {
  stopAutoMove();
  stopNavigation();
  resetOrganicState();
  moveState = "idle";
  broadcast({ type: "moveState:changed", state: "idle" });
}

export function setMoveStateManual() {
  if (moveState === "idle") {
    moveState = "manual";
    broadcast({ type: "moveState:changed", state: "manual" });
  }
}
