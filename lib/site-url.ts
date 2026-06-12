const LOCAL_SITE_URL = "http://localhost:3000";
const PLACEHOLDER_HOSTS = new Set(["api.example.com"]);

export function normalizeSiteUrl(url?: string | null) {
  const trimmed = url?.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    const hostname = parsed.hostname.toLowerCase();
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

    if (PLACEHOLDER_HOSTS.has(hostname)) {
      return null;
    }

    if (isLocalhost && isRunningOnVercel()) {
      return null;
    }

    parsed.hash = "";
    parsed.search = "";
    parsed.pathname = parsed.pathname.replace(/\/+$/, "");

    return parsed.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function getSiteUrl() {
  const configuredSiteUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

  if (configuredSiteUrl) {
    return configuredSiteUrl;
  }

  const vercelDeploymentUrl = process.env.VERCEL_URL?.trim();

  if (vercelDeploymentUrl) {
    return `https://${vercelDeploymentUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;
  }

  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }

  return LOCAL_SITE_URL;
}

export function buildAbsoluteUrl(path: string, baseUrl?: string | null) {
  const resolvedBaseUrl = normalizeSiteUrl(baseUrl) ?? getSiteUrl();

  try {
    return new URL(path, `${resolvedBaseUrl.replace(/\/+$/, "")}/`).toString();
  } catch {
    return path;
  }
}

function isRunningOnVercel() {
  return Boolean(process.env.VERCEL || process.env.VERCEL_URL);
}
