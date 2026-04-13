import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DEFAULT_SPEEDS } from "../shared/constants.js";
import type { Settings } from "../shared/types.js";
import { config } from "./config.js";

const settingsFile = path.join(config.dataDir, "settings.json");

const defaultSettings: Settings = {
  speedKmh: DEFAULT_SPEEDS.walk,
  moveType: "walk",
  speedVariance: false,
  confirmTeleport: true,
  autoReverse: false,
  movementBehavior: "natural",
};

export function loadSettings(): Settings {
  try {
    if (existsSync(settingsFile)) {
      const raw = readFileSync(settingsFile, "utf-8");
      return { ...defaultSettings, ...JSON.parse(raw) };
    }
  } catch {
    // ignore
  }
  return { ...defaultSettings };
}

export function saveSettings(settings: Settings) {
  const dir = path.dirname(settingsFile);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
}
