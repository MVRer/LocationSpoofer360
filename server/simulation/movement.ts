import {
  AUTO_MOVE_INTERVAL_MS,
  DEFAULT_SPEEDS,
  kmhToMs,
  SPEED_VARIANCE_MAX,
  SPEED_VARIANCE_MIN,
} from "../../shared/constants.js";
import type { Coord, MoveState, MoveType } from "../../shared/types.js";
import { broadcast } from "../ws/handler.js";
import { getCurrentHeading, getCurrentLocation, simulateLocation } from "./location.js";
import { advanceNavigation, getNavigation, stopNavigation } from "./navigation.js";

let moveType: MoveType = "walk";
let moveState: MoveState = "idle";
let speedKmh = DEFAULT_SPEEDS.walk;
let speedVarianceEnabled = false;
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

function getEffectiveSpeed(): number {
  let speed = kmhToMs(speedKmh);
  if (speedVarianceEnabled) {
    const factor = SPEED_VARIANCE_MIN + Math.random() * (SPEED_VARIANCE_MAX - SPEED_VARIANCE_MIN);
    speed *= factor;
  }
  return speed;
}

export async function step(): Promise<Coord | null> {
  const current = getCurrentLocation();
  if (!current) return null;

  const nav = getNavigation();

  if (nav && moveState === "navigation") {
    // Navigation mode: advance along route
    const result = advanceNavigation(getEffectiveSpeed(), AUTO_MOVE_INTERVAL_MS / 1000);
    if (!result) {
      // Navigation finished
      return current;
    }
    const distance = haversineDistance(current, result);
    totalDistanceMeters += distance;
    broadcast({ type: "distance:update", totalMeters: totalDistanceMeters });
    await simulateLocation(result);
    return result;
  }

  // Manual/auto: move in current heading direction
  const speed = getEffectiveSpeed();
  const distance = speed * (AUTO_MOVE_INTERVAL_MS / 1000);
  const next = destinationPoint(current, getCurrentHeading(), distance);
  totalDistanceMeters += distance;
  broadcast({ type: "distance:update", totalMeters: totalDistanceMeters });
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
  moveState = "navigation";
  broadcast({ type: "moveState:changed", state: "navigation" });
  autoMoveTimer = setInterval(() => step(), AUTO_MOVE_INTERVAL_MS);
}

export function stopMovement() {
  stopAutoMove();
  stopNavigation();
  moveState = "idle";
  broadcast({ type: "moveState:changed", state: "idle" });
}

export function setMoveStateManual() {
  if (moveState === "idle") {
    moveState = "manual";
    broadcast({ type: "moveState:changed", state: "manual" });
  }
}
