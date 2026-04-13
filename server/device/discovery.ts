import { DEVICE_POLL_INTERVAL_MS } from "../../shared/constants.js";
import type { Device } from "../../shared/types.js";
import { log } from "../log.js";
import { broadcast } from "../ws/handler.js";
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
    const proc = Bun.spawn([pmd3, "--no-color", "usbmux", "list"], {
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, PATH: getPythonEnvPath() },
    });

    const output = await new Response(proc.stdout).text();
    await proc.exited;

    if (proc.exitCode !== 0) {
      const stderr = proc.stderr ? await new Response(proc.stderr).text() : "";
      log.error(`usbmux list failed (exit ${proc.exitCode}): ${stderr.trim()}`);
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

    const parsed: unknown = JSON.parse(output);
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
