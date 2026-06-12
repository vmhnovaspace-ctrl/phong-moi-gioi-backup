import { buildAbsoluteUrl, normalizeSiteUrl } from "@/lib/site-url";

const INTERNAL_PROJECT_HOST_PREFIX = "phong-moi-gioi-backup";
const INTERNAL_SHARE_PATHS = [/^\/(?:l|b|r|p)\//, /^\/s\/rooms(?:\/|$)/];

export function getBrowserOrigin() {
  if (typeof window === "undefined" || !window.location.origin) {
    return null;
  }

  return normalizeSiteUrl(window.location.origin);
}

export function buildClientAbsoluteUrl(path: string, fallbackBaseUrl?: string | null) {
  const browserOrigin = getBrowserOrigin();

  return buildAbsoluteUrl(path, browserOrigin ?? fallbackBaseUrl);
}

export function rebaseInternalUrlsToBrowserOrigin(text: string) {
  const browserOrigin = getBrowserOrigin();

  if (!browserOrigin) {
    return text;
  }

  return text.replace(/https?:\/\/[^\s<>"')]+/g, (rawUrl) => {
    try {
      const parsed = new URL(rawUrl);

      if (!shouldRebaseInternalUrl(parsed)) {
        return rawUrl;
      }

      return new URL(`${parsed.pathname}${parsed.search}${parsed.hash}`, `${browserOrigin}/`).toString();
    } catch {
      return rawUrl;
    }
  });
}

function shouldRebaseInternalUrl(url: URL) {
  if (!INTERNAL_SHARE_PATHS.some((pattern) => pattern.test(url.pathname))) {
    return false;
  }

  const hostname = url.hostname.toLowerCase();

  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "api.example.com" ||
    (hostname.endsWith(".vercel.app") && hostname.startsWith(INTERNAL_PROJECT_HOST_PREFIX))
  );
}
