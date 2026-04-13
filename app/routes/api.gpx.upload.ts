import { parseGpx } from "../../server/gpx/parser.js";
import type { Route } from "./+types/api.gpx.upload";

export async function action({ request }: Route.ActionArgs) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    let xmlContent: string;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!(file && file instanceof File)) {
        return Response.json({ error: "No file uploaded" }, { status: 400 });
      }
      xmlContent = await file.text();
    } else {
      xmlContent = await request.text();
    }

    const gpxData = parseGpx(xmlContent);
    return Response.json(gpxData);
  } catch (err) {
    return Response.json(
      { error: `Failed to parse GPX: ${err}` },
      { status: 400 },
    );
  }
}
