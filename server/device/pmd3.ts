import { existsSync } from "node:fs";
import path from "node:path";

const SEARCH_PATHS = [
  "/opt/homebrew/bin/pymobiledevice3",
  "/usr/local/bin/pymobiledevice3",
  "/Library/Frameworks/Python.framework/Versions/3.13/bin/pymobiledevice3",
  "/Library/Frameworks/Python.framework/Versions/3.12/bin/pymobiledevice3",
  "/Library/Frameworks/Python.framework/Versions/3.11/bin/pymobiledevice3",
];

function getUserPaths(): string[] {
  const home = process.env.HOME ?? "";
  return [
    path.join(home, "Library/Python/3.14/bin/pymobiledevice3"),
    path.join(home, "Library/Python/3.13/bin/pymobiledevice3"),
    path.join(home, "Library/Python/3.12/bin/pymobiledevice3"),
    path.join(home, "Library/Python/3.11/bin/pymobiledevice3"),
    path.join(home, ".local/bin/pymobiledevice3"),
  ];
}

let cachedPath: string | null = null;

export async function findPMD3Path(): Promise<string | null> {
  if (cachedPath) return cachedPath;

  // Check known paths
  const allPaths = [...SEARCH_PATHS, ...getUserPaths()];
  for (const p of allPaths) {
    if (existsSync(p)) {
      cachedPath = p;
      return p;
    }
  }

  // Fallback: which
  try {
    const proc = Bun.spawn(["which", "pymobiledevice3"], {
      stdout: "pipe",
      stderr: "ignore",
    });
    const output = await new Response(proc.stdout).text();
    const trimmed = output.trim();
    if (trimmed && existsSync(trimmed)) {
      cachedPath = trimmed;
      return trimmed;
    }
  } catch {
    // ignore
  }

  return null;
}

export function getPythonEnvPath(): string {
  const existing = process.env.PATH ?? "";
  const extras = [
    "/opt/homebrew/bin",
    "/usr/local/bin",
    "/Library/Frameworks/Python.framework/Versions/Current/bin",
    `${process.env.HOME}/.local/bin`,
  ];
  return [...extras, existing].join(":");
}
