import type { Coord } from "../../shared/types.js";

const EARTH_RADIUS = 6371000;

// --- Gaussian random (Box-Muller) ---

function gaussianRandom(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// --- Persistent state ---

let bearingWobbleValue = 0;
let driftPhase = Math.random() * Math.PI * 2;
let driftPeriod = 15 + Math.random() * 20; // 15-35 second oscillation
let currentActualSpeed = 0;
let stepCount = 0;

export function resetOrganicState() {
  bearingWobbleValue = 0;
  driftPhase = Math.random() * Math.PI * 2;
  driftPeriod = 15 + Math.random() * 20;
  currentActualSpeed = 0;
  stepCount = 0;
}

// --- GPS Jitter ---
// Real GPS has ±1-3m noise on every reading

export function addGpsJitter(coord: Coord, meters = 0.5): Coord {
  const jitterLat = gaussianRandom() * meters;
  const jitterLng = gaussianRandom() * meters;

  const dLat = jitterLat / EARTH_RADIUS;
  const dLng = jitterLng / (EARTH_RADIUS * Math.cos((coord.lat * Math.PI) / 180));

  return {
    lat: coord.lat + (dLat * 180) / Math.PI,
    lng: coord.lng + (dLng * 180) / Math.PI,
  };
}

// --- Bearing Wobble ---
// Humans don't walk in perfectly straight lines — smooth ±3° random walk

export function addBearingWobble(bearingDeg: number): number {
  // Random walk with exponential smoothing
  const noise = gaussianRandom() * 0.8; // raw noise ±0.8°
  bearingWobbleValue = bearingWobbleValue * 0.85 + noise * 0.15; // heavy smoothing
  // Clamp to ±2°
  bearingWobbleValue = Math.max(-2, Math.min(2, bearingWobbleValue));
  return bearingDeg + bearingWobbleValue;
}

// --- Lateral Drift ---
// Small perpendicular offset that oscillates slowly (sidewalk wandering)

export function addLateralDrift(
  coord: Coord,
  bearingDeg: number,
  deltaSeconds: number,
): Coord {
  stepCount++;
  driftPhase += (deltaSeconds / driftPeriod) * Math.PI * 2;

  // Slowly vary the period
  if (stepCount % 60 === 0) {
    driftPeriod = 15 + Math.random() * 20;
  }

  const driftMeters = Math.sin(driftPhase) * 0.4; // ±0.4m lateral
  // Perpendicular bearing
  const perpBearing = ((bearingDeg + 90) * Math.PI) / 180;
  const dLat = (driftMeters * Math.cos(perpBearing)) / EARTH_RADIUS;
  const dLng =
    (driftMeters * Math.sin(perpBearing)) /
    (EARTH_RADIUS * Math.cos((coord.lat * Math.PI) / 180));

  return {
    lat: coord.lat + (dLat * 180) / Math.PI,
    lng: coord.lng + (dLng * 180) / Math.PI,
  };
}

// --- Speed Curves ---
// Gradual acceleration/deceleration instead of instant speed changes

export function computeSmoothSpeed(
  targetSpeedMs: number,
  deltaSeconds: number,
  moveType: string,
): number {
  const accel: Record<string, { up: number; down: number }> = {
    walk: { up: 1.0, down: 1.5 },
    cycle: { up: 0.8, down: 2.0 },
    drive: { up: 2.5, down: 3.5 },
  };

  const { up, down } = accel[moveType] ?? accel.walk;
  const diff = targetSpeedMs - currentActualSpeed;

  if (Math.abs(diff) < 0.05) {
    currentActualSpeed = targetSpeedMs;
  } else if (diff > 0) {
    currentActualSpeed += Math.min(diff, up * deltaSeconds);
  } else {
    currentActualSpeed += Math.max(diff, -down * deltaSeconds);
  }

  return Math.max(0, currentActualSpeed);
}

// --- Apply all organic transforms to a coordinate ---

export function applyOrganic(
  coord: Coord,
  bearingDeg: number,
  deltaSeconds: number,
): { coord: Coord; bearing: number } {
  const wobbledBearing = addBearingWobble(bearingDeg);
  const drifted = addLateralDrift(coord, bearingDeg, deltaSeconds);
  const jittered = addGpsJitter(drifted);
  return { coord: jittered, bearing: wobbledBearing };
}
