const API_VERSION = "2.0.0";
const API_NAME = "CHISEFRK API";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "public, max-age=60, s-maxage=300"
};

function json(data, init = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      ...JSON_HEADERS,
      ...(init.headers || {})
    }
  });
}

function cors(response) {
  const headers = new Headers(response.headers);

  headers.set("access-control-allow-origin", "*");
  headers.set("access-control-allow-methods", "GET, OPTIONS");
  headers.set(
    "access-control-allow-headers",
    "Content-Type, Authorization"
  );

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function endpoint(name, method, path, description) {
  return {
    name,
    method,
    path,
    description
  };
}

function apiInfo(origin) {
  return {
    status: true,
    name: API_NAME,
    version: API_VERSION,
    runtime: "Cloudflare Workers",
    baseUrl: origin,
    endpoints: {
      root: "/api",
      health: "/api/health",
      info: "/api/info",
      list: "/api/list",
      quoteRandom: "/api/quote/random",
      quoteAll: "/api/quote/all"
    }
  };
}

function apiList() {
  return {
    status: true,
    total: 6,
    data: [
      endpoint(
        "API Root",
        "GET",
        "/api",
        "API metadata and endpoint overview."
      ),
      endpoint(
        "Health",
        "GET",
        "/api/health",
        "Check API availability."
      ),
      endpoint(
        "Info",
        "GET",
        "/api/info",
        "Get API information and metadata."
      ),
      endpoint(
        "Endpoint List",
        "GET",
        "/api/list",
        "List all currently available API endpoints."
      ),
      endpoint(
        "Random Quote",
        "GET",
        "/api/quote/random",
        "Return one random quote."
      ),
      endpoint(
        "All Quotes",
        "GET",
        "/api/quote/all",
        "Return the complete quote dataset."
      )
    ]
  };
}

async function getQuotes(env, request) {
  const assetUrl = new URL("/api/quote/all.json", request.url);
  const response = await env.ASSETS.fetch(assetUrl);

  if (!response.ok) {
    return {
      error: json(
        {
          status: false,
          error: "QUOTE_DATA_UNAVAILABLE"
        },
        { status: 503 }
      )
    };
  }

  let payload;

  try {
    payload = await response.json();
  } catch {
    return {
      error: json(
        {
          status: false,
          error: "QUOTE_DATA_INVALID"
        },
        { status: 503 }
      )
    };
  }

  if (!Array.isArray(payload.data) || payload.data.length === 0) {
    return {
      error: json(
        {
          status: false,
          error: "QUOTE_DATA_EMPTY"
        },
        { status: 503 }
      )
    };
  }

  return {
    data: payload.data
  };
}

async function handleApi(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method !== "GET") {
    return cors(
      json(
        {
          status: false,
          error: "METHOD_NOT_ALLOWED",
          allowed: ["GET", "OPTIONS"]
        },
        {
          status: 405,
          headers: {
            allow: "GET, OPTIONS"
          }
        }
      )
    );
  }

  if (path === "/api" || path === "/api/") {
    return cors(json(apiInfo(url.origin)));
  }

  if (path === "/api/health") {
    return cors(
      json({
        status: true,
        service: API_NAME,
        version: API_VERSION,
        uptime: "edge",
        timestamp: new Date().toISOString()
      })
    );
  }

  if (path === "/api/info") {
    return cors(
      json({
        status: true,
        name: API_NAME,
        version: API_VERSION,
        description:
          "Free public API and utility collection built by CHISEFRK.",
        author: "CHISEFRK",
        runtime: "Cloudflare Workers",
        baseUrl: url.origin,
        endpoints: apiInfo(url.origin).endpoints
      })
    );
  }

  if (path === "/api/list") {
    return cors(json(apiList()));
  }

  if (
    path === "/api/quote/random" ||
    path === "/api/quote/random.js"
  ) {
    const result = await getQuotes(env, request);

    if (result.error) {
      return cors(result.error);
    }

    const index = Math.floor(Math.random() * result.data.length);

    return cors(
      json({
        status: true,
        data: result.data[index]
      })
    );
  }

  if (path === "/api/quote/all") {
    const result = await getQuotes(env, request);

    if (result.error) {
      return cors(result.error);
    }

    return cors(
      json({
        status: true,
        total: result.data.length,
        data: result.data
      })
    );
  }

  return cors(
    json(
      {
        status: false,
        error: "ENDPOINT_NOT_FOUND",
        path
      },
      {
        status: 404
      }
    )
  );
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return cors(new Response(null, { status: 204 }));
    }

    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      return handleApi(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};
