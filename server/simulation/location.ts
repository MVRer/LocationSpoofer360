import type { Subprocess } from "bun";
import type { Coord } from "../../shared/types.js";
import { findPMD3Path, getPythonEnvPath } from "../device/pmd3.js";
import { broadcast } from "../ws/handler.js";

let activeProcess: Subprocess | null = null;
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

function killActiveProcess() {
  if (!activeProcess) return;
  try {
    if (activeProcess.exitCode === null) {
      activeProcess.kill();
      // Fallback to SIGINT after 1 second
      const proc = activeProcess;
      setTimeout(() => {
        if (proc.exitCode === null) {
          proc.kill(2); // SIGINT
        }
      }, 1000);
    }
  } catch {
    // process may already be dead
  }
  activeProcess = null;
}

export async function simulateLocation(coord: Coord): Promise<{ ok: boolean; message: string }> {
  if (!selectedUdid) {
    return { ok: false, message: "No device selected" };
  }

  const pmd3 = await findPMD3Path();
  if (!pmd3) {
    return { ok: false, message: "pymobiledevice3 not found" };
  }

  // Kill existing simulation
  killActiveProcess();

  try {
    const args = [
      pmd3,
      "developer", "dvt", "simulate-location", "set",
      "--tunnel", selectedUdid,
      "--",
      String(coord.lat),
      String(coord.lng),
    ];

    activeProcess = Bun.spawn(args, {
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, PATH: getPythonEnvPath() },
    });

    // Wait 2 seconds for process to establish connection
    await Bun.sleep(2000);

    if (activeProcess.exitCode !== null) {
      // Process exited early - read stderr for error
      const stderr = await new Response(activeProcess.stderr).text();
      activeProcess = null;
      return { ok: false, message: `Simulation failed: ${stderr.trim() || "process exited"}` };
    }

    currentLocation = coord;
    broadcast({
      type: "location:changed",
      lat: coord.lat,
      lng: coord.lng,
      heading: currentHeading,
    });

    return { ok: true, message: "Location set" };
  } catch (err) {
    return { ok: false, message: `Failed to simulate location: ${err}` };
  }
}

export function resetLocation(): { ok: boolean; message: string } {
  killActiveProcess();
  currentLocation = null;
  broadcast({ type: "location:reset" });
  return { ok: true, message: "Location reset" };
}

export function isSimulating(): boolean {
  return activeProcess !== null && activeProcess.exitCode === null;
}

export function cleanup() {
  killActiveProcess();
}
