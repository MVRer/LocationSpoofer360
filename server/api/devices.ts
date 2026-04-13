import { get, post, json, error } from "./router.js";
import { getDevices, refreshDevices } from "../device/discovery.js";
import { setSelectedUdid } from "../simulation/location.js";

get("/api/devices", async () => {
  const devices = await refreshDevices();
  return json(devices);
});

post("/api/devices/:udid/select", async (_req, params) => {
  const { udid } = params;
  const devices = getDevices();
  const device = devices.find((d) => d.udid === udid);
  if (!device) {
    return error("Device not found", 404);
  }
  setSelectedUdid(udid);
  return json({ ok: true, device });
});
