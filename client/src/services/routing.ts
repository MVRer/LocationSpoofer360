const OSRM_BASE = "https://router.project-osrm.org";

const PROFILE_MAP: Record<string, string> = {
  walk: "foot",
  cycle: "bike",
  drive: "car",
};

export interface RouteResult {
  coordinates: { lat: number; lng: number }[];
  distanceMeters: number;
  durationSeconds: number;
}

export async function calculateRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  moveType: string,
): Promise<RouteResult> {
  const profile = PROFILE_MAP[moveType] ?? "car";
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url = `${OSRM_BASE}/route/v1/${profile}/${coords}?overview=full&geometries=geojson`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.code !== "Ok" || !data.routes?.length) {
    throw new Error(`Routing failed: ${data.message ?? data.code}`);
  }

  const route = data.routes[0];
  const coordinates = route.geometry.coordinates.map(([lng, lat]: [number, number]) => ({
    lat,
    lng,
  }));

  return {
    coordinates,
    distanceMeters: route.distance,
    durationSeconds: route.duration,
  };
}
