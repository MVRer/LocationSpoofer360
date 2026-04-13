import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { RecentLocation } from "../../shared/types.js";
import { config } from "../config.js";
import { del, get, json, post } from "./router.js";

const MAX_RECENT = 10;
const recentFile = path.join(config.dataDir, "recent-locations.json");

function load(): RecentLocation[] {
  try {
    if (existsSync(recentFile)) {
      return JSON.parse(readFileSync(recentFile, "utf-8"));
    }
  } catch {
    // ignore
  }
  return [];
}

function save(locations: RecentLocation[]) {
  const dir = path.dirname(recentFile);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(recentFile, JSON.stringify(locations, null, 2));
}

get("/api/recent-locations", () => {
  return json(load());
});

post("/api/recent-locations", async (req) => {
  const body: RecentLocation = await req.json();
  const locations = load();

  // Remove duplicate if exists
  const filtered = locations.filter(
    (r) => r.coord.lat !== body.coord.lat || r.coord.lng !== body.coord.lng,
  );

  // Add to front, cap at MAX_RECENT
  const updated = [body, ...filtered].slice(0, MAX_RECENT);
  save(updated);
  return json(updated);
});

del("/api/recent-locations", () => {
  save([]);
  return json({ ok: true });
});
