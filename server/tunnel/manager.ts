import { TUNNEL_CHECK_INTERVAL_MS, TUNNEL_CHECK_TIMEOUT_MS } from "../../shared/constants.js";
import { findPMD3Path, getPythonEnvPath } from "../device/pmd3.js";
import { log } from "../log.js";
import { broadcast } from "../sse/emitter.js";
import { fireAndForget, run, sleep } from "../util/proc.js";

let tunneldStartedByUs = false;

export async function isTunneldRunning(): Promise<boolean> {
  try {
    const result = await run(["pgrep", "-f", "pymobiledevice3.*tunneld"]);
    return result.exitCode === 0;
  } catch {
    return false;
  }
}

export async function startTunneld(): Promise<{ ok: boolean; message: string; running: boolean }> {
  const alreadyRunning = await isTunneldRunning();
  if (alreadyRunning) {
    log.tunnel("Already running");
    broadcast({ type: "tunnel:status", running: true });
    return { ok: true, message: "Tunnel already running", running: true };
  }

  const pmd3 = await findPMD3Path();
  if (!pmd3) {
    log.error("pymobiledevice3 not found");
    return {
      ok: false,
      message: "pymobiledevice3 not found. Install with: pip3 install pymobiledevice3",
      running: false,
    };
  }

  log.tunnel("Starting...");
  const platform = process.platform;

  try {
    log.tunnel(`Found pymobiledevice3 at: ${pmd3}`);

    if (platform === "darwin") {
      const script = `do shell script "PATH=${getPythonEnvPath()} ${pmd3} remote tunneld -d" with administrator privileges`;
      log.tunnel("Running osascript command");
      const osResult = run(["osascript", "-e", script], {
        stdout: "pipe",
        stderr: "pipe",
      });
      // Log result in background (don't block)
      osResult.then((r) => {
        if (r.exitCode !== 0) {
          log.error(`osascript failed (exit ${r.exitCode}): ${r.stderr.trim()}`);
        }
      });
    } else {
      fireAndForget(["sudo", pmd3, "remote", "tunneld", "-d"], {
        env: { ...process.env, PATH: getPythonEnvPath() },
      });
    }

    // Poll for tunneld to start
    const startTime = Date.now();
    while (Date.now() - startTime < TUNNEL_CHECK_TIMEOUT_MS) {
      await sleep(TUNNEL_CHECK_INTERVAL_MS);
      if (await isTunneldRunning()) {
        tunneldStartedByUs = true;
        log.tunnel("Started successfully");
        broadcast({ type: "tunnel:status", running: true });
        return { ok: true, message: "Tunnel started", running: true };
      }
    }

    log.error("Tunnel failed to start within timeout");
    return {
      ok: false,
      message: "Tunnel failed to start within timeout. Was the password dialog cancelled?",
      running: false,
    };
  } catch (err) {
    log.error(`Failed to start tunnel: ${err}`);
    return { ok: false, message: `Failed to start tunnel: ${err}`, running: false };
  }
}

export async function stopTunneld(): Promise<{ ok: boolean; message: string; running: boolean }> {
  if (!(await isTunneldRunning())) {
    log.tunnel("Not running, nothing to stop");
    broadcast({ type: "tunnel:status", running: false });
    return { ok: true, message: "Tunnel not running", running: false };
  }

  log.tunnel("Stopping...");
  try {
    if (process.platform === "darwin") {
      const script = `do shell script "kill -9 $(pgrep -f 'pymobiledevice3.*tunneld')" with administrator privileges`;
      const result = await run(["osascript", "-e", script], {
        stdout: "pipe",
        stderr: "pipe",
      });
      if (result.exitCode !== 0) {
        log.error(`osascript kill failed (exit ${result.exitCode}): ${result.stderr.trim()}`);
      }
    } else {
      await run(
        ["bash", "-c", "sudo kill -9 $(pgrep -f 'pymobiledevice3.*tunneld')"],
      );
    }

    // Verify it's actually dead
    await sleep(500);
    if (await isTunneldRunning()) {
      log.error("Tunnel still running after kill -9");
      return { ok: false, message: "Failed to stop tunnel", running: true };
    }

    tunneldStartedByUs = false;
    log.tunnel("Stopped");
    broadcast({ type: "tunnel:status", running: false });
    return { ok: true, message: "Tunnel stopped", running: false };
  } catch (err) {
    log.error(`Failed to stop tunnel: ${err}`);
    return { ok: false, message: `Failed to stop tunnel: ${err}`, running: false };
  }
}

export function wasTunneldStartedByUs(): boolean {
  return tunneldStartedByUs;
}
