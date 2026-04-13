const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = "LocationSpoofer360/1.0";

let lastRequestTime = 0;
const MIN_INTERVAL = 1100; // 1.1 seconds to respect Nominatim's 1 req/sec policy

async function throttledFetch(url: string): Promise<any> {
  const now = Date.now();
  const wait = Math.max(0, MIN_INTERVAL - (now - lastRequestTime));
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestTime = Date.now();

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });
  return res.json();
}

export interface SearchResult {
  lat: number;
  lng: number;
  displayName: string;
  type: string;
}

export async function searchLocation(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`;
  const results = await throttledFetch(url);
  return results.map((r: any) => ({
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
    displayName: r.display_name,
    type: r.type,
  }));
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const url = `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lng}&format=json`;
  const result = await throttledFetch(url);
  return result.display_name ?? `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}
