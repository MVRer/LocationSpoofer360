import { getDevices, refreshDevices } from "../../server/device/discovery.js";
import { setSelectedUdid } from "../../server/simulation/location.js";
import type { Route } from "./+types/api.devices";

export async function loader() {
  const devices = await refreshDevices();
  return Response.json(devices);
}

export async function action({ request }: Route.ActionArgs) {
  const { udid } = await request.json();
  const devices = getDevices();
  const device = devices.find((d) => d.udid === udid);
  if (!device) {
    return Response.json({ error: "Device not found" }, { status: 404 });
  }
  setSelectedUdid(udid);
  return Response.json({ ok: true, device });
}
