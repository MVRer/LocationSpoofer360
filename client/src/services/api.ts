const BASE = "";

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export const api = {
  // Devices
  getDevices: () => request<any[]>("GET", "/api/devices"),
  selectDevice: (udid: string) => request<any>("POST", `/api/devices/${udid}/select`),

  // Tunnel
  getTunnelStatus: () => request<{ running: boolean }>("GET", "/api/tunnel/status"),
  startTunnel: () => request<{ ok: boolean; message: string }>("POST", "/api/tunnel/start"),
  stopTunnel: () => request<{ ok: boolean; message: string }>("POST", "/api/tunnel/stop"),

  // Location
  setLocation: (lat: number, lng: number) =>
    request<{ ok: boolean; message: string }>("POST", "/api/location/set", { lat, lng }),
  resetLocation: () => request<{ ok: boolean; message: string }>("POST", "/api/location/reset"),

  // Movement
  step: () => request<any>("POST", "/api/movement/step"),
  setHeading: (degrees: number) => request<any>("POST", "/api/movement/heading", { degrees }),
  setMode: (mode: "auto" | "manual") => request<any>("POST", "/api/movement/mode", { mode }),
  setMoveType: (type: string) => request<any>("POST", "/api/movement/type", { type }),
  setSpeed: (kmh: number) => request<any>("POST", "/api/movement/speed", { kmh }),
  setVariance: (enabled: boolean) => request<any>("POST", "/api/movement/variance", { enabled }),

  // Navigation
  startNavigation: (waypoints: { lat: number; lng: number }[]) =>
    request<any>("POST", "/api/navigation/start", { waypoints }),
  stopNavigation: () => request<any>("POST", "/api/navigation/stop"),
  setAutoReverse: (enabled: boolean) => request<any>("POST", "/api/navigation/reverse", { enabled }),

  // GPX
  uploadGpx: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${BASE}/api/gpx/upload`, { method: "POST", body: formData });
    return res.json();
  },

  // Settings
  getSettings: () => request<any>("GET", "/api/settings"),
  updateSettings: (settings: Record<string, any>) => request<any>("PUT", "/api/settings", settings),
};
