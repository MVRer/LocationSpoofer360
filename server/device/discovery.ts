import { DEVICE_POLL_INTERVAL_MS } from "../../shared/constants.js";
import type { Device } from "../../shared/types.js";
import { log } from "../log.js";
import { broadcast } from "../sse/emitter.js";
import { run } from "../util/proc.js";
import { findPMD3Path, getPythonEnvPath } from "./pmd3.js";

let knownDevices: Device[] = [];

export function getDevices(): Device[] {
  return knownDevices;
}

export async function refreshDevices(): Promise<Device[]> {
  const pmd3 = await findPMD3Path();
  if (!pmd3) {
    knownDevices = [];
    return [];
  }

  try {
    const result = await run([pmd3, "--no-color", "usbmux", "list"], {
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, PATH: getPythonEnvPath() },
    });

    if (result.exitCode !== 0) {
      log.error(`usbmux list failed (exit ${result.exitCode}): ${result.stderr.trim()}`);
      return knownDevices;
    }

    interface PMD3DeviceEntry {
      Identifier?: string;
      UniqueDeviceID?: string;
      SerialNumber?: string;
      DeviceName?: string;
      ProductName?: string;
      ProductType?: string;
      ProductVersion?: string;
      ConnectionType?: string;
    }

    const trimmed = result.stdout.trim();
    if (!trimmed || trimmed === "[]") {
      if (knownDevices.length > 0) {
        for (const device of knownDevices) {
          log.device(`Disconnected: ${device.name}`);
          broadcast({ type: "device:disconnected", udid: device.udid });
        }
        knownDevices = [];
      }
      return [];
    }

    const parsed: unknown = JSON.parse(trimmed);
    const devices: Device[] = (Array.isArray(parsed) ? (parsed as PMD3DeviceEntry[]) : []).map(
      (d) => ({
        udid: d.Identifier ?? d.UniqueDeviceID ?? d.SerialNumber ?? "unknown",
        name: d.DeviceName ?? d.ProductName ?? "iOS Device",
        productType: d.ProductType ?? "unknown",
        osVersion: d.ProductVersion ?? "unknown",
        connectionType: d.ConnectionType === "Network" ? ("network" as const) : ("usb" as const),
      }),
    );

    // Diff and broadcast changes
    const oldUdids = new Set(knownDevices.map((d) => d.udid));
    const newUdids = new Set(devices.map((d) => d.udid));

    for (const device of devices) {
      if (!oldUdids.has(device.udid)) {
        log.device(`Connected: ${device.name} (iOS ${device.osVersion}, ${device.connectionType})`);
        broadcast({ type: "device:connected", device });
      }
    }

    for (const device of knownDevices) {
      if (!newUdids.has(device.udid)) {
        log.device(`Disconnected: ${device.name}`);
        broadcast({ type: "device:disconnected", udid: device.udid });
      }
    }

    knownDevices = devices;
    return devices;
  } catch (err) {
    log.error(`Failed to list devices: ${err}`);
    return knownDevices;
  }
}

let pollTimer: ReturnType<typeof setInterval> | null = null;

export function startDevicePolling() {
  if (pollTimer) return;
  refreshDevices();
  pollTimer = setInterval(refreshDevices, DEVICE_POLL_INTERVAL_MS);
  log.device("Polling started");
}

export function stopDevicePolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}
