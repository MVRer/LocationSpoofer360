import type { Device } from "../../shared/types.js";
import { DEVICE_POLL_INTERVAL_MS } from "../../shared/constants.js";
import { findPMD3Path, getPythonEnvPath } from "./pmd3.js";
import { broadcast } from "../ws/handler.js";

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
    const proc = Bun.spawn([pmd3, "usbmux", "list", "--no-color", "-o", "json"], {
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, PATH: getPythonEnvPath() },
    });

    const output = await new Response(proc.stdout).text();
    await proc.exited;

    if (proc.exitCode !== 0) {
      return knownDevices;
    }

    const parsed = JSON.parse(output);
    const devices: Device[] = (Array.isArray(parsed) ? parsed : []).map((d: any) => ({
      udid: d.Identifier ?? d.UniqueDeviceID ?? d.SerialNumber ?? "unknown",
      name: d.DeviceName ?? d.ProductName ?? "iOS Device",
      productType: d.ProductType ?? "unknown",
      osVersion: d.ProductVersion ?? "unknown",
      connectionType: d.ConnectionType === "Network" ? "network" as const : "usb" as const,
    }));

    // Diff and broadcast changes
    const oldUdids = new Set(knownDevices.map((d) => d.udid));
    const newUdids = new Set(devices.map((d) => d.udid));

    for (const device of devices) {
      if (!oldUdids.has(device.udid)) {
        broadcast({ type: "device:connected", device });
      }
    }

    for (const device of knownDevices) {
      if (!newUdids.has(device.udid)) {
        broadcast({ type: "device:disconnected", udid: device.udid });
      }
    }

    knownDevices = devices;
    return devices;
  } catch (err) {
    console.error("[discovery] Failed to list devices:", err);
    return knownDevices;
  }
}

let pollTimer: ReturnType<typeof setInterval> | null = null;

export function startDevicePolling() {
  if (pollTimer) return;
  refreshDevices();
  pollTimer = setInterval(refreshDevices, DEVICE_POLL_INTERVAL_MS);
  console.log("[discovery] Device polling started");
}

export function stopDevicePolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}
