export const API_REGISTRY = [
  {
    name: "API Root",
    method: "GET",
    path: "/api",
    category: "Core",
    description: "API metadata and endpoint overview.",
    status: "stable"
  },
  {
    name: "Health",
    method: "GET",
    path: "/api/health",
    category: "Core",
    description: "Check API availability.",
    status: "stable"
  },
  {
    name: "Info",
    method: "GET",
    path: "/api/info",
    category: "Core",
    description: "Get API information and metadata.",
    status: "stable"
  },
  {
    name: "Endpoint List",
    method: "GET",
    path: "/api/list",
    category: "Core",
    description: "List all currently available API endpoints.",
    status: "stable"
  },
  {
    name: "Random Quote",
    method: "GET",
    path: "/api/quote/random",
    category: "Quote",
    description: "Return one random quote.",
    status: "stable"
  },
  {
    name: "All Quotes",
    method: "GET",
    path: "/api/quote/all",
    category: "Quote",
    description: "Return the complete quote dataset.",
    status: "stable"
  },
  {
    name: "Universal Downloader",
    method: "POST",
    path: "/api/download",
    category: "Downloader",
    description:
      "Resolve downloadable media from supported public media URLs.",
    status: "experimental"
  }
];

export function getEndpoint(path, method = "GET") {
  return API_REGISTRY.find(
    endpoint =>
      endpoint.path === path &&
      endpoint.method === method
  );
}

export function getCategories() {
  return [...new Set(API_REGISTRY.map(endpoint => endpoint.category))];
}
