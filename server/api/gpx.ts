import { post, json, error } from "./router.js";
import { parseGpx } from "../gpx/parser.js";

post("/api/gpx/upload", async (req) => {
  try {
    const contentType = req.headers.get("content-type") ?? "";

    let xmlContent: string;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");
      if (!file || !(file instanceof File)) {
        return error("No file uploaded");
      }
      xmlContent = await file.text();
    } else {
      xmlContent = await req.text();
    }

    const gpxData = parseGpx(xmlContent);
    return json(gpxData);
  } catch (err) {
    return error(`Failed to parse GPX: ${err}`);
  }
});
