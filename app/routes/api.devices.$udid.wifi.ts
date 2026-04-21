import { getWifiState, setWifiState } from "../../server/device/wifi.js";
import type { Route } from "./+types/api.devices.$udid.wifi";

export async function loader({ params }: Route.LoaderArgs) {
  const state = await getWifiState(params.udid);
  return Response.json({ state });
}

export async function action({ params, request }: Route.ActionArgs) {
  const body = (await request.json().catch(() => ({}))) as { state?: "on" | "off" };
  if (body.state !== "on" && body.state !== "off") {
    return Response.json({ ok: false, message: "state must be 'on' or 'off'" }, { status: 400 });
  }
  const result = await setWifiState(params.udid, body.state);
  return Response.json(result, { status: result.ok ? 200 : 500 });
}
