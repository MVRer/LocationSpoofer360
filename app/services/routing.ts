const VALHALLA_BASE = "https://valhalla1.openstreetmap.de";

const PROFILE_MAP: Record<string, string> = {
  walk: "pedestrian",
  cycle: "bicycle",
  drive: "auto",
};

export interface RouteResult {
  coordinates: { lat: number; lng: number }[];
  distanceMeters: number;
  durationSeconds: number;
}

/** Decode Google-format encoded polyline into coordinate array */
function decodePolyline(encoded: string): { lat: number; lng: number }[] {
  const coords: { lat: number; lng: number }[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    coords.push({ lat: lat / 1e6, lng: lng / 1e6 });
  }

  return coords;
}

export async function calculateRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  moveType: string,
): Promise<RouteResult> {
  const costing = PROFILE_MAP[moveType] ?? "auto";

  const body = {
    locations: [
      { lat: from.lat, lon: from.lng },
      { lat: to.lat, lon: to.lng },
    ],
    costing,
    directions_options: { units: "kilometers" },
  };

  const res = await fetch(`${VALHALLA_BASE}/route`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (data.error) {
    throw new Error(`Routing failed: ${data.error}`);
  }

  const trip = data.trip;
  const leg = trip.legs[0];
  const raw = decodePolyline(leg.shape);

  // Interpolate so no segment is longer than 5 meters — gives smooth
  // movement, granular progress, and a detailed polyline on the map
  const coordinates = interpolateRoute(raw, 5);

  return {
    coordinates,
    distanceMeters: trip.summary.length * 1000, // km to meters
    durationSeconds: trip.summary.time,
  };
}

/** Insert intermediate points so no segment exceeds maxMeters */
function interpolateRoute(
  coords: { lat: number; lng: number }[],
  maxMeters: number,
): { lat: number; lng: number }[] {
  if (coords.length < 2) return coords;

  const result: { lat: number; lng: number }[] = [coords[0]];

  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];
    const dist = haversineDist(prev, curr);

    if (dist > maxMeters) {
      const segments = Math.ceil(dist / maxMeters);
      for (let s = 1; s < segments; s++) {
        const t = s / segments;
        result.push({
          lat: prev.lat + (curr.lat - prev.lat) * t,
          lng: prev.lng + (curr.lng - prev.lng) * t,
        });
      }
    }

    result.push(curr);
  }

  return result;
}

function haversineDist(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}
