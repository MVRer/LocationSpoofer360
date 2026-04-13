const R = 6371000;

export function haversine(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function polylineDistance(coords: { lat: number; lng: number }[]): number {
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    total += haversine(coords[i - 1], coords[i]);
  }
  return total;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
}

/** Normalize Leaflet coordinates to valid GPS range. Leaflet returns
 *  unwrapped longitudes (e.g. -459 instead of -99) when the map is panned. */
export function normalizeCoord(lat: number, lng: number): { lat: number; lng: number } {
  let normalizedLng = ((lng + 180) % 360) - 180;
  if (normalizedLng < -180) normalizedLng += 360;
  return {
    lat: Math.max(-90, Math.min(90, lat)),
    lng: normalizedLng,
  };
}
