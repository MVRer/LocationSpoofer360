import { getDevices } from "../../server/device/discovery.js";
import { ensureBootstrap } from "../../server/bootstrap.js";
import { log } from "../../server/log.js";
import {
  getCurrentHeading,
  getCurrentLocation,
} from "../../server/simulation/location.js";
import {
  getMoveState,
  getMoveType,
  getSpeedKmh,
  getTotalDistance,
} from "../../server/simulation/movement.js";
import { createSSEStream, send } from "../../server/sse/emitter.js";
import { isTunneldRunning } from "../../server/tunnel/manager.js";

export async function loader() {
  ensureBootstrap();

  const { response, client } = createSSEStream();

  log.ws("SSE client connected");

  // Send initial state snapshot
  send(client, { type: "device:list", devices: getDevices() });

  isTunneldRunning().then((running) => {
    send(client, { type: "tunnel:status", running });
  });

  const loc = getCurrentLocation();
  if (loc) {
    send(client, {
      type: "location:changed",
      lat: loc.lat,
      lng: loc.lng,
      heading: getCurrentHeading(),
    });
    send(client, { type: "moveState:changed", state: getMoveState() });
    send(client, { type: "moveType:changed", moveType: getMoveType() });
    send(client, { type: "speed:changed", kmh: getSpeedKmh() });
    send(client, { type: "distance:update", totalMeters: getTotalDistance() });
  }

  return response;
}
