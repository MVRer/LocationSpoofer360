import { log } from "../log.js";

const TUNNELD_URL = "http://127.0.0.1:49151/";
const TIMEOUT_MS = 1000;

export interface TunneldEntry {
  udid: string;
  address: string;
  port: number;
  interface: string;
  /** "usb" if the interface name indicates USB transport, else "network" */
  transport: "usb" | "network";
}

interface TunneldRow {
  "tunnel-address": string;
  "tunnel-port": number;
  interface: string;
}

/**
 * Fetch the list of devices currently tunneled by `pymobiledevice3 remote tunneld`.
 * Returns [] if tunneld is down, unreachable, or returns a non-200.
 *
 * Tunneld response shape: { "<udid>": [{ "tunnel-address", "tunnel-port", "interface" }, ...] }
 * A device may have multiple tunnels (e.g. USB + WiFi) — we surface each one.
 */
export async function getTunneldDevices(): Promise<TunneldEntry[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(TUNNELD_URL, { signal: ctrl.signal });
    if (!res.ok) return [];
    const body = (await res.json()) as Record<string, TunneldRow[]>;
    const entries: TunneldEntry[] = [];
    for (const [udid, rows] of Object.entries(body)) {
      for (const row of rows) {
        entries.push({
          udid,
          address: row["tunnel-address"],
          port: row["tunnel-port"],
          interface: row.interface,
          transport: row.interface.toLowerCase().includes("usb") ? "usb" : "network",
        });
      }
    }
    return entries;
  } catch (err) {
    if ((err as Error).name !== "AbortError") {
      log.error(`tunneld query failed: ${(err as Error).message}`);
    }
    return [];
  } finally {
    clearTimeout(timer);
  }
}
