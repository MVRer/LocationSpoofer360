import { XMLParser } from "fast-xml-parser";
import type { Coord, GpxData, GpxRoute, GpxTrack } from "../../shared/types.js";

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

export function parseGpx(xmlContent: string): GpxData {
  const parsed = xmlParser.parse(xmlContent);
  const gpx = parsed.gpx;
  if (!gpx) throw new Error("Invalid GPX: missing <gpx> root element");

  const name = gpx.metadata?.name ?? "Untitled";

  // Parse tracks
  const tracks: GpxTrack[] = [];
  const rawTracks = toArray(gpx.trk);
  for (const trk of rawTracks) {
    const segments: Coord[][] = [];
    const rawSegs = toArray(trk.trkseg);
    for (const seg of rawSegs) {
      const points = toArray(seg.trkpt).map(ptToCoord);
      if (points.length > 0) segments.push(points);
    }
    if (segments.length > 0) {
      tracks.push({ name: trk.name ?? `Track ${tracks.length + 1}`, segments });
    }
  }

  // Parse routes
  const routes: GpxRoute[] = [];
  const rawRoutes = toArray(gpx.rte);
  for (const rte of rawRoutes) {
    const points = toArray(rte.rtept).map(ptToCoord);
    if (points.length > 0) {
      routes.push({ name: rte.name ?? `Route ${routes.length + 1}`, points });
    }
  }

  // Parse waypoints
  const waypoints: Coord[] = toArray(gpx.wpt).map(ptToCoord);

  return { name, tracks, routes, waypoints };
}

interface GpxPoint {
  "@_lat": string;
  "@_lon": string;
}

function ptToCoord(pt: GpxPoint): Coord {
  return {
    lat: parseFloat(pt["@_lat"]),
    lng: parseFloat(pt["@_lon"]),
  };
}

function toArray<T>(val: T | T[] | undefined | null): T[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}
