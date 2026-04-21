import { spawn as nodeSpawn, type ChildProcess } from "node:child_process";

interface SpawnOptions {
  stdout?: "pipe" | "ignore";
  stderr?: "pipe" | "ignore";
  env?: Record<string, string | undefined>;
}

interface SpawnResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

/**
 * Cross-runtime spawn that works in both Bun and Node.
 * Runs a command, waits for exit, and returns stdout/stderr/exitCode.
 */
export function run(
  cmd: string[],
  options: SpawnOptions = {},
): Promise<SpawnResult> {
  return new Promise((resolve, reject) => {
    const proc = nodeSpawn(cmd[0], cmd.slice(1), {
      stdio: [
        "ignore",
        options.stdout ?? "ignore",
        options.stderr ?? "ignore",
      ],
      env: options.env as NodeJS.ProcessEnv,
    });

    let stdout = "";
    let stderr = "";

    if (proc.stdout) {
      proc.stdout.on("data", (data: Buffer) => {
        stdout += data.toString();
      });
    }
    if (proc.stderr) {
      proc.stderr.on("data", (data: Buffer) => {
        stderr += data.toString();
      });
    }

    proc.on("close", (code) => {
      resolve({ exitCode: code ?? 1, stdout, stderr });
    });

    proc.on("error", (err) => {
      reject(err);
    });
  });
}

/**
 * Fire-and-forget spawn. Does not wait for exit.
 */
export function fireAndForget(
  cmd: string[],
  options: SpawnOptions = {},
) {
  try {
    const proc = nodeSpawn(cmd[0], cmd.slice(1), {
      stdio: ["ignore", "ignore", "ignore"],
      detached: true,
      env: options.env as NodeJS.ProcessEnv,
    });
    proc.unref();
  } catch {
    // ignore spawn errors
  }
}

/**
 * Capped fire-and-forget pool. Spawns freely for smooth movement,
 * but caps at MAX_POOL processes. Old ones auto-remove on exit.
 * Call flushPool() when navigation finishes to kill all but the last one.
 */
const MAX_POOL = 15;
const pools = new Map<string, ChildProcess[]>();

export function spawnCapped(
  slot: string,
  cmd: string[],
  options: SpawnOptions = {},
) {
  let pool = pools.get(slot);
  if (!pool) {
    pool = [];
    pools.set(slot, pool);
  }

  // Prune finished processes
  const alive = pool.filter((p) => p.exitCode === null);

  // At cap — kill the oldest to make room
  while (alive.length >= MAX_POOL) {
    const oldest = alive.shift();
    if (oldest && oldest.exitCode === null) {
      try { oldest.kill("SIGTERM"); } catch {}
    }
  }

  pools.set(slot, alive);

  try {
    const proc = nodeSpawn(cmd[0], cmd.slice(1), {
      stdio: ["ignore", "ignore", "ignore"],
      env: options.env as NodeJS.ProcessEnv,
    });
    alive.push(proc);
  } catch {
    // ignore spawn errors
  }
}

/**
 * Kill all processes in a slot except the most recently spawned one.
 * Call this when navigation finishes or location is reset.
 */
export function flushPool(slot: string) {
  const pool = pools.get(slot);
  if (!pool || pool.length === 0) return;

  // Keep only the last one, kill the rest
  const last = pool[pool.length - 1];
  for (const proc of pool) {
    if (proc !== last && proc.exitCode === null) {
      try {
        proc.kill("SIGTERM");
      } catch {
        // already dead
      }
    }
  }
  pools.set(slot, last.exitCode === null ? [last] : []);
}

/**
 * Cross-runtime sleep.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
