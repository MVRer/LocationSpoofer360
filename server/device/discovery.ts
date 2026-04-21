import { DEVICE_POLL_INTERVAL_MS } from "../../shared/constants.js";
import type { Device } from "../../shared/types.js";
import { log } from "../log.js";
import { broadcast } from "../sse/emitter.js";
import { run } from "../util/proc.js";
import { findPMD3Path, getPythonEnvPath } from "./pmd3.js";
import { getTunneldDevices } from "./tunneldClient.js";

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
    const usbDevices: Device[] = (Array.isArray(parsed) ? (parsed as PMD3DeviceEntry[]) : []).map(
      (d) => ({
        udid: d.Identifier ?? d.UniqueDeviceID ?? d.SerialNumber ?? "unknown",
        name: d.DeviceName ?? d.ProductName ?? "iOS Device",
        productType: d.ProductType ?? "unknown",
        osVersion: d.ProductVersion ?? "unknown",
        connectionType: d.ConnectionType === "Network" ? ("network" as const) : ("usb" as const),
      }),
    );

    // Merge in WiFi-only devices visible to tunneld but not on usbmux.
    // Reuse last-known name/version from previously-seen devices.
    const usbUdids = new Set(usbDevices.map((d) => d.udid));
    const tunneld = await getTunneldDevices();
    const seenWifi = new Set<string>();
    const wifiDevices: Device[] = [];
    for (const entry of tunneld) {
      if (entry.transport !== "network") continue;
      if (usbUdids.has(entry.udid)) continue;
      if (seenWifi.has(entry.udid)) continue;
      seenWifi.add(entry.udid);
      const last = knownDevices.find((d) => d.udid === entry.udid);
      wifiDevices.push({
        udid: entry.udid,
        name: last?.name ?? "iOS Device",
        productType: last?.productType ?? "unknown",
        osVersion: last?.osVersion ?? "unknown",
        connectionType: "network",
      });
    }
    const devices: Device[] = [...usbDevices, ...wifiDevices];

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
