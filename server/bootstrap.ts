import { startDevicePolling, stopDevicePolling } from "./device/discovery.js";
import { log } from "./log.js";
import { cleanup as cleanupSimulation } from "./simulation/location.js";
import { stopMovement } from "./simulation/movement.js";
import { stopTunneld, wasTunneldStartedByUs } from "./tunnel/manager.js";

let bootstrapped = false;

export function ensureBootstrap() {
  if (bootstrapped) return;
  bootstrapped = true;

  startDevicePolling();

  async function shutdown() {
    log.server("Shutting down...");
    stopDevicePolling();
    stopMovement();
    cleanupSimulation();
    if (wasTunneldStartedByUs()) {
      log.tunnel("Stopping tunneld we started...");
      await stopTunneld();
    }
    process.exit(0);
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
