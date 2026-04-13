import { TUNNEL_CHECK_INTERVAL_MS, TUNNEL_CHECK_TIMEOUT_MS } from "../../shared/constants.js";
import { findPMD3Path, getPythonEnvPath } from "../device/pmd3.js";
import { broadcast } from "../ws/handler.js";

let tunneldStartedByUs = false;

export async function isTunneldRunning(): Promise<boolean> {
  try {
    const proc = Bun.spawn(["pgrep", "-f", "pymobiledevice3.*tunneld"], {
      stdout: "ignore",
      stderr: "ignore",
    });
    await proc.exited;
    return proc.exitCode === 0;
  } catch {
    return false;
  }
}

export async function startTunneld(): Promise<{ ok: boolean; message: string }> {
  if (await isTunneldRunning()) {
    broadcast({ type: "tunnel:status", running: true });
    return { ok: true, message: "Tunnel already running" };
  }

  const pmd3 = await findPMD3Path();
  if (!pmd3) {
    return {
      ok: false,
      message: "pymobiledevice3 not found. Install with: pip3 install pymobiledevice3",
    };
  }

  const platform = process.platform;

  try {
    if (platform === "darwin") {
      // macOS: use osascript for native admin password dialog
      const script = `do shell script "PATH=${getPythonEnvPath()} ${pmd3} remote tunneld -d" with administrator privileges`;
      Bun.spawn(["osascript", "-e", script], {
        stdout: "ignore",
        stderr: "ignore",
      });
    } else {
      // Linux: spawn with sudo (user must have passwordless sudo or run in terminal)
      Bun.spawn(["sudo", pmd3, "remote", "tunneld", "-d"], {
        stdout: "ignore",
        stderr: "ignore",
        env: { ...process.env, PATH: getPythonEnvPath() },
      });
    }

    // Poll for tunneld to start
    const startTime = Date.now();
    while (Date.now() - startTime < TUNNEL_CHECK_TIMEOUT_MS) {
      await Bun.sleep(TUNNEL_CHECK_INTERVAL_MS);
      if (await isTunneldRunning()) {
        tunneldStartedByUs = true;
        broadcast({ type: "tunnel:status", running: true });
        return { ok: true, message: "Tunnel started" };
      }
    }

    return {
      ok: false,
      message: "Tunnel failed to start within timeout. Was the password dialog cancelled?",
    };
  } catch (err) {
    return { ok: false, message: `Failed to start tunnel: ${err}` };
  }
}

export async function stopTunneld(): Promise<{ ok: boolean; message: string }> {
  if (!(await isTunneldRunning())) {
    broadcast({ type: "tunnel:status", running: false });
    return { ok: true, message: "Tunnel not running" };
  }

  try {
    if (process.platform === "darwin") {
      const script = `do shell script "kill $(pgrep -f 'pymobiledevice3.*tunneld')" with administrator privileges`;
      const proc = Bun.spawn(["osascript", "-e", script], {
        stdout: "ignore",
        stderr: "ignore",
      });
      await proc.exited;
    } else {
      const proc = Bun.spawn(["bash", "-c", "sudo kill $(pgrep -f 'pymobiledevice3.*tunneld')"], {
        stdout: "ignore",
        stderr: "ignore",
      });
      await proc.exited;
    }

    tunneldStartedByUs = false;
    broadcast({ type: "tunnel:status", running: false });
    return { ok: true, message: "Tunnel stopped" };
  } catch (err) {
    return { ok: false, message: `Failed to stop tunnel: ${err}` };
  }
}

export function wasTunneldStartedByUs(): boolean {
  return tunneldStartedByUs;
}
