import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPythonEnvPath } from "../device/pmd3.js";
import { log } from "../log.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DAEMON_SCRIPT = path.resolve(__dirname, "../pymd/sim_location_daemon.py");

interface Daemon {
  udid: string;
  proc: ChildProcessWithoutNullStreams;
  ready: Promise<void>;
}

let current: Daemon | null = null;

function spawnDaemon(udid: string): Daemon {
  const proc = spawn("python3", [DAEMON_SCRIPT, udid], {
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env, PATH: getPythonEnvPath() },
  });

  let readyResolve: () => void;
  let readyReject: (err: Error) => void;
  const ready = new Promise<void>((res, rej) => {
    readyResolve = res;
    readyReject = rej;
  });

  let stdoutBuf = "";
  proc.stdout.on("data", (chunk: Buffer) => {
    stdoutBuf += chunk.toString();
    let newlineIdx: number;
    while ((newlineIdx = stdoutBuf.indexOf("\n")) !== -1) {
      const line = stdoutBuf.slice(0, newlineIdx).trim();
      stdoutBuf = stdoutBuf.slice(newlineIdx + 1);
      if (line === "ready") {
        log.sim(`Location daemon ready for ${udid}`);
        readyResolve();
      } else if (line.startsWith("err:")) {
        log.error(`[daemon ${udid}] ${line}`);
        if (line.startsWith("err:connect:")) readyReject(new Error(line));
      }
      // "ok" lines: ignore (success ack)
    }
  });

  proc.stderr.on("data", (chunk: Buffer) => {
    log.error(`[daemon ${udid}] stderr: ${chunk.toString().trim()}`);
  });

  proc.on("exit", (code, signal) => {
    log.sim(`Location daemon for ${udid} exited (code=${code} signal=${signal})`);
    if (current?.proc === proc) current = null;
  });

  proc.on("error", (err) => {
    log.error(`[daemon ${udid}] spawn error: ${err.message}`);
    readyReject(err);
  });

  return { udid, proc, ready };
}

/**
 * Get (or create) the daemon for the given udid. If a daemon exists for a
 * different udid, it's shut down first.
 */
export function getDaemon(udid: string): Daemon {
  if (current && current.udid === udid && current.proc.exitCode === null) {
    return current;
  }

  if (current) {
    log.sim(`Switching daemon from ${current.udid} to ${udid}`);
    shutdownDaemon();
  }

  current = spawnDaemon(udid);
  return current;
}

/**
 * Send a "lat,lng" command to the daemon. Non-blocking.
 */
export async function sendLocation(udid: string, lat: number, lng: number) {
  const daemon = getDaemon(udid);
  try {
    await daemon.ready;
  } catch (err) {
    log.error(`Daemon not ready: ${err}`);
    return;
  }
  if (daemon.proc.exitCode === null && daemon.proc.stdin.writable) {
    daemon.proc.stdin.write(`${lat},${lng}\n`);
  }
}

/**
 * Send a "clear" command to the daemon.
 */
export async function clearLocation(udid: string) {
  const daemon = getDaemon(udid);
  try {
    await daemon.ready;
  } catch {
    return;
  }
  if (daemon.proc.exitCode === null && daemon.proc.stdin.writable) {
    daemon.proc.stdin.write("clear\n");
  }
}

/**
 * Shut down the daemon WITHOUT clearing the simulated location.
 * iOS's locationd keeps the spoofed coordinates in its own state — the DVT
 * call already wrote it there. Closing our socket doesn't revert the phone.
 * The spoof persists until: the user explicitly resets, the device reboots,
 * or Apple's internal heuristics kick in.
 *
 * If you want to actually clear the location, call clearLocation() first.
 */
export function shutdownDaemon() {
  if (!current) return;
  const proc = current.proc;
  try {
    proc.stdin.end();
  } catch {}
  setTimeout(() => {
    if (proc.exitCode === null) {
      try { proc.kill("SIGTERM"); } catch {}
    }
  }, 1000);
  current = null;
}
