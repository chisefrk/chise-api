const SUPPORTED_HOSTS = {
  youtube: [
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "youtu.be",
    "music.youtube.com"
  ],

  instagram: [
    "instagram.com",
    "www.instagram.com"
  ],

  tiktok: [
    "tiktok.com",
    "www.tiktok.com",
    "vm.tiktok.com",
    "vt.tiktok.com"
  ],

  facebook: [
    "facebook.com",
    "www.facebook.com",
    "fb.watch"
  ],

  twitter: [
    "twitter.com",
    "www.twitter.com",
    "x.com",
    "www.x.com"
  ],

  pinterest: [
    "pinterest.com",
    "www.pinterest.com",
    "pin.it"
  ],

  reddit: [
    "reddit.com",
    "www.reddit.com",
    "redd.it"
  ],

  soundcloud: [
    "soundcloud.com",
    "www.soundcloud.com"
  ]
};

function normalizeHostname(hostname) {
  return hostname.toLowerCase().replace(/^www\./, "");
}

export function detectPlatform(input) {
  let url;

  try {
    url = new URL(input);
  } catch {
    return null;
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    return null;
  }

  const hostname = normalizeHostname(url.hostname);

  for (const [platform, hosts] of Object.entries(SUPPORTED_HOSTS)) {
    if (
      hosts.some(host => {
        const normalized = host.replace(/^www\./, "");
        return hostname === normalized || hostname.endsWith(`.${normalized}`);
      })
    ) {
      return platform;
    }
  }

  return "unknown";
}

function normalizeCobaltResponse(payload, platform) {
  if (!payload || typeof payload !== "object") {
    return {
      status: false,
      error: "INVALID_DOWNLOADER_RESPONSE"
    };
  }

  if (payload.status === "error") {
    return {
      status: false,
      platform,
      error: "DOWNLOADER_ERROR",
      details: payload.error || null
    };
  }

  if (payload.status === "picker") {
    return {
      status: true,
      platform,
      type: "collection",
      medias: Array.isArray(payload.picker)
        ? payload.picker.map(item => ({
            type: item.type,
            url: item.url,
            thumbnail: item.thumb || null
          }))
        : [],
      audio: payload.audio || null,
      audioFilename: payload.audioFilename || null
    };
  }

  if (
    payload.status === "tunnel" ||
    payload.status === "redirect"
  ) {
    return {
      status: true,
      platform,
      type: "media",
      delivery: payload.status,
      url: payload.url,
      filename: payload.filename || null
    };
  }

  if (payload.status === "local-processing") {
    return {
      status: true,
      platform,
      type: "local-processing",
      process: payload.type || null,
      tunnels: payload.tunnel || [],
      output: payload.output || null,
      audio: payload.audio || null,
      isHLS: payload.isHLS || false
    };
  }

  return {
    status: false,
    platform,
    error: "UNSUPPORTED_DOWNLOADER_RESPONSE",
    details: payload.status || null
  };
}

export async function downloadMedia(env, input, options = {}) {
  const platform = detectPlatform(input);

  if (!platform) {
    return {
      status: false,
      error: "INVALID_URL",
      message: "A valid HTTP or HTTPS URL is required."
    };
  }

  if (platform === "unknown") {
    return {
      status: false,
      error: "UNSUPPORTED_PLATFORM",
      message: "The supplied URL is not from a supported platform."
    };
  }

  if (!env.DOWNLOADER_URL) {
    return {
      status: false,
      platform,
      error: "DOWNLOADER_ENGINE_NOT_CONFIGURED",
      message:
        "The downloader engine is not configured on this deployment."
    };
  }

  const body = {
    url: input,
    downloadMode: options.downloadMode || "auto",
    videoQuality: options.videoQuality || "1080",
    audioFormat: options.audioFormat || "mp3",
    audioBitrate: options.audioBitrate || "128",
    filenameStyle: options.filenameStyle || "basic",
    disableMetadata: options.disableMetadata ?? false,
    youtubeVideoCodec: options.youtubeVideoCodec || "h264",
    youtubeVideoContainer:
      options.youtubeVideoContainer || "auto",
    tiktokFullAudio: options.tiktokFullAudio ?? false,
    youtubeBetterAudio: options.youtubeBetterAudio ?? false,
    youtubeHLS: options.youtubeHLS ?? false
  };

  const headers = {
    "accept": "application/json",
    "content-type": "application/json"
  };

  if (env.DOWNLOADER_TOKEN) {
    headers.authorization = `Bearer ${env.DOWNLOADER_TOKEN}`;
  }

  let response;

  try {
    response = await fetch(env.DOWNLOADER_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });
  } catch {
    return {
      status: false,
      platform,
      error: "DOWNLOADER_UNREACHABLE"
    };
  }

  let payload;

  try {
    payload = await response.json();
  } catch {
    return {
      status: false,
      platform,
      error: "DOWNLOADER_INVALID_JSON",
      httpStatus: response.status
    };
  }

  if (!response.ok) {
    return {
      status: false,
      platform,
      error: "DOWNLOADER_HTTP_ERROR",
      httpStatus: response.status,
      details: payload
    };
  }

  return normalizeCobaltResponse(payload, platform);
}
