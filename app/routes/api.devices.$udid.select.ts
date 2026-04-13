import { getDevices } from "../../server/device/discovery.js";
import { setSelectedUdid } from "../../server/simulation/location.js";
import type { Route } from "./+types/api.devices.$udid.select";

export async function action({ params }: Route.ActionArgs) {
  const { udid } = params;
  const devices = getDevices();
  const device = devices.find((d) => d.udid === udid);
  if (!device) {
    return Response.json({ error: "Device not found" }, { status: 404 });
  }
  setSelectedUdid(udid);
  return Response.json({ ok: true, device });
}
