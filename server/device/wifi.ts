import { log } from "../log.js";
import { run } from "../util/proc.js";
import { findPMD3Path, getPythonEnvPath } from "./pmd3.js";

export type WifiState = "on" | "off" | "unknown";

async function pmd3(args: string[]): Promise<{ exitCode: number; stdout: string; stderr: string } | null> {
  const pmd3Path = await findPMD3Path();
  if (!pmd3Path) return null;
  return run([pmd3Path, "--no-color", ...args], {
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, PATH: getPythonEnvPath() },
  });
}

/**
 * Run a lockdown wifi-connections command. Tries the tunnel transport first
 * (works for both USB- and WiFi-tunneled devices), falls back to the default
 * usbmux path if tunneld doesn't know the device.
 */
async function runWifiConn(udid: string, state?: "on" | "off") {
  const stateArgs = state ? ["--state", state] : [];
  const tunnel = await pmd3(["lockdown", "wifi-connections", ...stateArgs, "--tunnel", udid]);
  if (tunnel && (tunnel.exitCode === 0 || tunnel.stderr.includes("No such value"))) {
    return tunnel;
  }
  // Fall back to usbmux (e.g., tunneld not running yet)
  return pmd3(["lockdown", "wifi-connections", ...stateArgs, "--udid", udid]);
}

export async function getWifiState(udid: string): Promise<WifiState> {
  const result = await runWifiConn(udid);
  if (!result) return "unknown";

  if (result.exitCode === 0) {
    try {
      const parsed = JSON.parse(result.stdout) as { EnableWifiConnections?: boolean };
      return parsed.EnableWifiConnections ? "on" : "off";
    } catch {
      return "unknown";
    }
  }

  // "No such value" = lockdown key never set on this device → effectively off
  if (result.stderr.includes("No such value")) return "off";

  return "unknown";
}

export async function setWifiState(
  udid: string,
  state: "on" | "off",
): Promise<{ ok: boolean; message: string }> {
  const result = await runWifiConn(udid, state);
  if (!result) {
    return { ok: false, message: "pymobiledevice3 not found" };
  }
  if (result.exitCode !== 0) {
    const msg = result.stderr.trim() || `Failed to set wifi-connections to ${state}`;
    log.error(`wifi-connections set failed: ${msg}`);
    return { ok: false, message: msg };
  }
  log.device(`Wifi-connections ${state} for ${udid}`);
  return { ok: true, message: `WiFi mode ${state}` };
}
