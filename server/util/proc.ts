import { spawn as nodeSpawn } from "node:child_process";

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
 * Cross-runtime sleep.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
