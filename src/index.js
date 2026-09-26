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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return withCors(new Response(null, { status: 204 }));
    }

    if (url.pathname === "/api" || url.pathname === "/api/") {
      return withCors(
        json({
          status: true,
          name: "CHISEFRK API",
          version: "2.0.0",
          runtime: "Cloudflare Workers",
          endpoints: {
            info: "/api/info",
            quoteRandom: "/api/quote/random",
            quoteAll: "/api/quote/all"
          }
        })
      );
    }

    if (url.pathname === "/api/info") {
      return withCors(
        json({
          status: true,
          name: "CHISEFRK API",
          version: "2.0.0",
          description:
            "Personal API and utility collection for CHISEFRK projects.",
          author: "CHISEFRK",
          runtime: "Cloudflare Workers",
          baseUrl: url.origin,
          endpoints: {
            info: "/api/info",
            quoteRandom: "/api/quote/random",
            quoteAll: "/api/quote/all"
          }
        })
      );
    }

    if (
      url.pathname === "/api/quote/random" ||
      url.pathname === "/api/quote/random.js"
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

    if (url.pathname === "/api/quote/all") {
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

    if (url.pathname.startsWith("/api/")) {
      const assetResponse = await env.ASSETS.fetch(request);

      if (assetResponse.status !== 404) {
        return withCors(assetResponse);
      }

      return withCors(
        json(
          {
            status: false,
            error: "ENDPOINT_NOT_FOUND",
            path: url.pathname
          },
          { status: 404 }
        )
      );
    }

    return env.ASSETS.fetch(request);
  }
};
