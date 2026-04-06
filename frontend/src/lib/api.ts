function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function isLocalhost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function getApiBaseUrl() {
  const publicApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

  if (publicApiBaseUrl) {
    return trimTrailingSlash(publicApiBaseUrl);
  }

  if (typeof window !== "undefined") {
    return isLocalhost(window.location.hostname)
      ? "http://localhost:4000/api"
      : "/api";
  }

  return "http://localhost:4000/api";
}

export function getApiUrl(path: string) {
  return `${getApiBaseUrl()}${path}`;
}
