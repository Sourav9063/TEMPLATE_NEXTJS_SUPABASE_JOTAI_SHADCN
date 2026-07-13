const redirectBaseUrl = "http://internal";

export function getSafeRedirectPath(value: unknown, fallback = "/"): string {
  if (typeof value !== "string" || !value.startsWith("/")) return fallback;

  try {
    const url = new URL(value, redirectBaseUrl);
    if (url.origin !== redirectBaseUrl) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
