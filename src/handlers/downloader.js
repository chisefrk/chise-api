import { downloadMedia } from "../services/downloader.js";

export async function handleDownloader(request, env, json) {
  let body;

  try {
    body = await request.json();
  } catch {
    return json(
      {
        status: false,
        error: "INVALID_JSON",
        message: "Request body must contain valid JSON."
      },
      { status: 400 }
    );
  }

  if (!body || typeof body.url !== "string") {
    return json(
      {
        status: false,
        error: "URL_REQUIRED",
        message: "The request body must contain a string 'url'."
      },
      { status: 400 }
    );
  }

  const url = body.url.trim();

  if (!url) {
    return json(
      {
        status: false,
        error: "URL_REQUIRED",
        message: "The URL cannot be empty."
      },
      { status: 400 }
    );
  }

  const result = await downloadMedia(env, url, body);

  const statusCode = result.status
    ? 200
    : result.error === "INVALID_URL" ||
      result.error === "UNSUPPORTED_PLATFORM"
      ? 400
      : result.error === "DOWNLOADER_ENGINE_NOT_CONFIGURED"
        ? 503
        : 502;

  return json(result, { status: statusCode });
}
