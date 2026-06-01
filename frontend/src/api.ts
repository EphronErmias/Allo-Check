function stripApiSuffix(url: string): string {
  return url.replace(/\/api\/v1\/?$/i, "").replace(/\/$/, "");
}

function toAbsoluteUrl(url: string): string {
  return url.startsWith("http") ? url : `https://${url}`;
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

/** Set from /config.json at startup (production). */
let runtimeApiUrl: string | undefined;

/**
 * Load optional runtime API URL (served by backend or static host).
 * Call once before rendering the app.
 */
export async function initApiConfig(): Promise<void> {
  try {
    const res = await fetch("/config.json", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { apiUrl?: string };
    const url = data.apiUrl?.trim();
    if (url) runtimeApiUrl = stripApiSuffix(url);
  } catch {
    /* static hosts without config.json fall back to build-time env */
  }
}

function configuredApiUrl(): string | undefined {
  return runtimeApiUrl ?? import.meta.env.VITE_API_URL?.trim() ?? undefined;
}

/**
 * API origin for REST calls (no trailing slash).
 * In dev, defaults to same-origin so Vite proxies /api to the backend.
 */
export function resolveApiBase(): string {
  const envUrl = configuredApiUrl();

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
        "API URL points at localhost but the site is not served locally; using same origin instead.",
      );
      return window.location.origin;
    }
    return base;
  }

  return window.location.origin;
}

export function apiUrl(path: string): string {
  const base = resolveApiBase();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${normalized}` : normalized;
}

export function formatFetchError(err: unknown, context = "AlloCheck API"): string {
  if (err instanceof Error) {
    if (err.message === "Failed to fetch" || err.name === "TypeError") {
      const target = resolveApiBase() || window.location.origin;
      return `Cannot reach the ${context} (${target}). If the API runs on another host, set PUBLIC_API_URL on the server or VITE_API_URL when building the frontend.`;
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
