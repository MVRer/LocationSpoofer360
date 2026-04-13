import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { RecentLocation } from "../shared/types.js";
import { config } from "./config.js";

const MAX_RECENT = 10;
const recentFile = path.join(config.dataDir, "recent-locations.json");

export function loadRecentLocations(): RecentLocation[] {
  try {
    if (existsSync(recentFile)) {
      return JSON.parse(readFileSync(recentFile, "utf-8"));
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveRecentLocations(locations: RecentLocation[]) {
  const dir = path.dirname(recentFile);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(recentFile, JSON.stringify(locations, null, 2));
}

export function addRecentLocation(location: RecentLocation): RecentLocation[] {
  const locations = loadRecentLocations();
  const filtered = locations.filter(
    (r) => r.coord.lat !== location.coord.lat || r.coord.lng !== location.coord.lng,
  );
  const updated = [location, ...filtered].slice(0, MAX_RECENT);
  saveRecentLocations(updated);
  return updated;
}

export function clearRecentLocations() {
  saveRecentLocations([]);
}
