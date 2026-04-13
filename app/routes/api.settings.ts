import { loadSettings, saveSettings } from "../../server/settings.js";
import type { Route } from "./+types/api.settings";

export function loader() {
  return Response.json(loadSettings());
}

export async function action({ request }: Route.ActionArgs) {
  const body = await request.json();
  const current = loadSettings();
  const updated = { ...current, ...body };
  saveSettings(updated);
  return Response.json(updated);
}
