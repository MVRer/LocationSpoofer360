import type { Coord } from "../../shared/types.js";
import { findPMD3Path, getPythonEnvPath } from "../device/pmd3.js";
import { log } from "../log.js";
import { broadcast } from "../sse/emitter.js";
import { run, spawnExclusive } from "../util/proc.js";

let selectedUdid: string | null = null;
let currentLocation: Coord | null = null;
let currentHeading = 0;

export function getSelectedUdid(): string | null {
  return selectedUdid;
}

export function setSelectedUdid(udid: string | null) {
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
 * Send the location to the iOS device via pymobiledevice3.
 * Kills the previous process before spawning a new one — only one alive at a time.
 */
function sendToDevice(coord: Coord) {
  if (!selectedUdid) return;

  findPMD3Path().then((pmd3) => {
    if (!pmd3) return;
    spawnExclusive(
      "simulate-location",
      [
        pmd3,
        "developer", "dvt", "simulate-location", "set",
        "--tunnel", selectedUdid!,
        "--", String(coord.lat), String(coord.lng),
      ],
      { env: { ...process.env, PATH: getPythonEnvPath() } },
    );
  });
}

export async function simulateLocation(coord: Coord): Promise<{ ok: boolean; message: string }> {
  updateLocation(coord);
  sendToDevice(coord);
  return { ok: true, message: "Location set" };
}

export async function resetLocation(): Promise<{ ok: boolean; message: string }> {
  log.sim("Reset location");
  if (selectedUdid) {
    const pmd3 = await findPMD3Path();
    if (pmd3) {
      try {
        await run(
          [pmd3, "developer", "dvt", "simulate-location", "clear", "--tunnel", selectedUdid],
          { env: { ...process.env, PATH: getPythonEnvPath() } },
        );
      } catch { /* best effort */ }
    }
  }

  currentLocation = null;
  broadcast({ type: "location:reset" });
  return { ok: true, message: "Location reset" };
}

export function isSimulating(): boolean {
  return currentLocation !== null;
}

export function cleanup() {}
