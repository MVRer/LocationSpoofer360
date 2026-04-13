import type { Device, GpxData, RecentLocation, Settings } from "@shared/types";

const BASE = "";

interface OkResponse {
  ok: boolean;
  message: string;
}

interface TunnelResponse extends OkResponse {
  running: boolean;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export const api = {
  getDevices: () => request<Device[]>("GET", "/api/devices"),
  selectDevice: (udid: string) => request<OkResponse>("POST", `/api/devices/${udid}/select`),

  getTunnelStatus: () => request<{ running: boolean }>("GET", "/api/tunnel/status"),
  startTunnel: () => request<TunnelResponse>("POST", "/api/tunnel/start"),
  stopTunnel: () => request<TunnelResponse>("POST", "/api/tunnel/stop"),

  setLocation: (lat: number, lng: number) =>
    request<OkResponse>("POST", "/api/location/set", { lat, lng }),
  resetLocation: () => request<OkResponse>("POST", "/api/location/reset"),

  step: () => request<OkResponse>("POST", "/api/movement/step"),
  setHeading: (degrees: number) =>
    request<OkResponse>("POST", "/api/movement/heading", { degrees }),
  setMode: (mode: "auto" | "manual") => request<OkResponse>("POST", "/api/movement/mode", { mode }),
  setMoveType: (type: string) => request<OkResponse>("POST", "/api/movement/type", { type }),
  setSpeed: (kmh: number) => request<OkResponse>("POST", "/api/movement/speed", { kmh }),
  setVariance: (enabled: boolean) =>
    request<OkResponse>("POST", "/api/movement/variance", { enabled }),

  startNavigation: (waypoints: { lat: number; lng: number }[]) =>
    request<OkResponse>("POST", "/api/navigation/start", { waypoints }),
  stopNavigation: () => request<OkResponse>("POST", "/api/navigation/stop"),
  setAutoReverse: (enabled: boolean) =>
    request<OkResponse>("POST", "/api/navigation/reverse", { enabled }),

  uploadGpx: async (file: File): Promise<GpxData> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${BASE}/api/gpx/upload`, { method: "POST", body: formData });
    return res.json();
  },

  getSettings: () => request<Settings>("GET", "/api/settings"),
  updateSettings: (settings: Partial<Settings>) =>
    request<Settings>("PUT", "/api/settings", settings),

  getRecentLocations: () => request<RecentLocation[]>("GET", "/api/recent-locations"),
  addRecentLocation: (loc: RecentLocation) =>
    request<OkResponse>("POST", "/api/recent-locations", loc),
  clearRecentLocations: () => request<OkResponse>("DELETE", "/api/recent-locations"),
};
