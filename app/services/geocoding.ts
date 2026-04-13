const PHOTON_BASE = "https://photon.komoot.io";

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
    street?: string;
    housenumber?: string;
    osm_value?: string;
  };
}

export interface SearchResult {
  lat: number;
  lng: number;
  displayName: string;
  type: string;
}

function buildDisplayName(p: PhotonFeature["properties"]): string {
  const parts: string[] = [];
  if (p.name) parts.push(p.name);
  if (p.street) {
    parts.push(p.housenumber ? `${p.street} ${p.housenumber}` : p.street);
  }
  if (p.city) parts.push(p.city);
  if (p.state) parts.push(p.state);
  if (p.country) parts.push(p.country);
  // Deduplicate (name often equals city or street)
  const seen = new Set<string>();
  return parts
    .filter((part) => {
      const lower = part.toLowerCase();
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    })
    .join(", ");
}

export async function searchLocation(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const url = `${PHOTON_BASE}/api?q=${encodeURIComponent(query)}&limit=5&lang=en`;
  const res = await fetch(url);
  const data = await res.json();

  if (!data.features?.length) return [];

  return data.features.map((f: PhotonFeature) => ({
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
    displayName: buildDisplayName(f.properties),
    type: f.properties.osm_value ?? "place",
  }));
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const url = `${PHOTON_BASE}/reverse?lon=${lng}&lat=${lat}&limit=1&lang=en`;
  const res = await fetch(url);
  const data = await res.json();

  const feature = data.features?.[0] as PhotonFeature | undefined;
  if (!feature) return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

  return buildDisplayName(feature.properties) || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}
