import {
  API_REGISTRY,
  getCategories
} from "./registry.js";

const API_VERSION = "2.0.0";

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

function withCors(response) {
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

async function getQuotes(env, request) {
  const assetUrl = new URL("/api/quote/all.json", request.url);
  const response = await env.ASSETS.fetch(assetUrl);

  if (!response.ok) {
    return json(
      {
        status: false,
        error: "QUOTE_DATA_UNAVAILABLE"
      },
      { status: 503 }
    );
  }

  const payload = await response.json();

  if (!Array.isArray(payload.data) || payload.data.length === 0) {
    return json(
      {
        status: false,
        error: "QUOTE_DATA_EMPTY"
      },
      { status: 503 }
    );
  }

  return payload.data;
}

function apiRoot(request) {
  const url = new URL(request.url);

  return {
    status: true,
    name: "CHISEFRK API",
    version: API_VERSION,
    runtime: "Cloudflare Workers",
    baseUrl: url.origin,
    endpoints: API_REGISTRY
  };
}

function apiInfo(request) {
  const url = new URL(request.url);

  return {
    status: true,
    name: "CHISEFRK API",
    version: API_VERSION,
    description:
      "Free public API and utility collection built by CHISEFRK.",
    author: "CHISEFRK",
    runtime: "Cloudflare Workers",
    baseUrl: url.origin,
    categories: getCategories()
  };
}

function apiList() {
  return {
    status: true,
    total: API_REGISTRY.length,
    categories: getCategories(),
    data: API_REGISTRY
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return withCors(
        new Response(null, {
          status: 204
        })
      );
    }

    if (request.method !== "GET") {
      return withCors(
        json(
          {
            status: false,
            error: "METHOD_NOT_ALLOWED",
            method: request.method,
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
      return withCors(json(apiRoot(request)));
    }

    if (path === "/api/health") {
      return withCors(
        json({
          status: true,
          service: "CHISEFRK API",
          version: API_VERSION,
          uptime: "edge",
          timestamp: new Date().toISOString()
        })
      );
    }

    if (path === "/api/info") {
      return withCors(json(apiInfo(request)));
    }

    if (path === "/api/list") {
      return withCors(json(apiList()));
    }

    if (
      path === "/api/quote/random" ||
      path === "/api/quote/random.js"
    ) {
      const quotes = await getQuotes(env, request);

      if (!Array.isArray(quotes)) {
        return withCors(quotes);
      }

      const index = Math.floor(Math.random() * quotes.length);

      return withCors(
        json({
          status: true,
          data: quotes[index]
        })
      );
    }

    if (path === "/api/quote/all") {
      const quotes = await getQuotes(env, request);

      if (!Array.isArray(quotes)) {
        return withCors(quotes);
      }

      return withCors(
        json({
          status: true,
          total: quotes.length,
          data: quotes
        })
      );
    }

    if (path.startsWith("/api/")) {
      const assetResponse = await env.ASSETS.fetch(request);

      if (assetResponse.status !== 404) {
        return withCors(assetResponse);
      }

      return withCors(
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

    return env.ASSETS.fetch(request);
  }
};
