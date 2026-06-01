function stripApiSuffix(url: string): string {
  return url.replace(/\/api\/v1\/?$/i, "").replace(/\/$/, "");
}

function toAbsoluteUrl(url: string): string {
  return url.startsWith("http") ? url : `http://${url}`;
}

function isLocalhostUrl(url: string): boolean {
  try {
    const { hostname } = new URL(toAbsoluteUrl(url));
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function isLocalhostPage(): boolean {
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

/**
 * API origin for REST calls (no trailing slash).
 * In dev, defaults to same-origin so Vite can proxy /api to the backend (works on LAN IPs too).
 */
export function resolveApiBase(): string {
  const envUrl = import.meta.env.VITE_API_URL?.trim();

  if (import.meta.env.DEV) {
    if (!envUrl || isLocalhostUrl(envUrl)) {
      return "";
    }
    return stripApiSuffix(envUrl);
  }

  if (envUrl) {
    const base = stripApiSuffix(envUrl);
    if (!isLocalhostPage() && isLocalhostUrl(base)) {
      console.warn(
        "VITE_API_URL points at localhost but the site is not served locally; using same origin instead.",
      );
      return window.location.origin;
    }
    return base;
  }

  return window.location.origin;
}

export const apiBase = resolveApiBase();

export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return apiBase ? `${apiBase}${normalized}` : normalized;
}

export function formatFetchError(err: unknown, context = "AlloCheck API"): string {
  if (err instanceof Error) {
    if (err.message === "Failed to fetch" || err.name === "TypeError") {
      const target = apiBase || window.location.origin;
      return `Cannot reach the ${context} (${target}). Start the backend (see ARCHITECTURE.md) or set VITE_API_URL to your API URL.`;
    }
    return err.message;
  }
  return "Request failed";
}

export async function readApiError(res: Response): Promise<string> {
  const text = await res.text();
  if (!text) return `Request failed (${res.status})`;
  try {
    const body = JSON.parse(text) as { message?: string };
    if (body.message) return body.message;
  } catch {
    /* plain text */
  }
  return text;
}
