import type { Coord } from "../../shared/types.js";
import { log } from "../log.js";
import { broadcast } from "../sse/emitter.js";
import { clearLocation, sendLocation, shutdownDaemon } from "./deviceBridge.js";

let selectedUdid: string | null = null;
let currentLocation: Coord | null = null;
let currentHeading = 0;

export function getSelectedUdid(): string | null {
  return selectedUdid;
}

export function setSelectedUdid(udid: string | null) {
  if (selectedUdid !== udid) {
    // Shutdown previous daemon — new udid will spawn a fresh one on next send
    shutdownDaemon();
  }
  selectedUdid = udid;
}

export function getCurrentLocation(): Coord | null {
  return currentLocation;
}

export function getCurrentHeading(): number {
  return currentHeading;
}

export function setCurrentHeading(degrees: number) {
  currentHeading = ((degrees % 360) + 360) % 360;
}

export function updateLocation(coord: Coord) {
  currentLocation = coord;
  broadcast({
    type: "location:changed",
    lat: coord.lat,
    lng: coord.lng,
    heading: currentHeading,
  });
}

/**
 * Send the location to the iOS device via the persistent Python daemon.
 * Non-blocking — just writes to the daemon's stdin.
 */
function sendToDevice(coord: Coord) {
  if (!selectedUdid) return;
  sendLocation(selectedUdid, coord.lat, coord.lng);
}

export async function simulateLocation(coord: Coord): Promise<{ ok: boolean; message: string }> {
  updateLocation(coord);
  sendToDevice(coord);
  return { ok: true, message: "Location set" };
}

export async function resetLocation(): Promise<{ ok: boolean; message: string }> {
  log.sim("Reset location");
  if (selectedUdid) {
    await clearLocation(selectedUdid);
  }

  currentLocation = null;
  broadcast({ type: "location:reset" });
  return { ok: true, message: "Location reset" };
}

export function isSimulating(): boolean {
  return currentLocation !== null;
}

export function cleanup() {
  shutdownDaemon();
}
