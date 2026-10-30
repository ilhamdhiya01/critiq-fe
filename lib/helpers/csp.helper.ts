// Content Security Policy, built per request by proxy.ts so every page gets
// its own script nonce (Next.js reads it from the request header and stamps
// it on its inline scripts).
//
// Trade-off: a nonce makes every page dynamically rendered. Critiq's pages
// already read the session cookie, so little is lost; the alternative,
// script-src 'unsafe-inline', would leave XSS unmitigated. Styles keep
// 'unsafe-inline' because React `style={}` attributes cannot carry a nonce.
//
// Shipped as Report-Only first: watch the console for violations, then
// switch CSP_HEADER to "Content-Security-Policy" to enforce.
export const CSP_HEADER = "Content-Security-Policy-Report-Only";

// Avatar hosts, kept in step with images.remotePatterns in next.config.ts.
const IMAGE_HOSTS = [
  "https://avatars.githubusercontent.com",
  "https://gitlab.com",
  "https://secure.gravatar.com",
  "https://www.gravatar.com",
];

// The API origin when NEXT_PUBLIC_API_URL is absolute (local dev), so XHR
// and the SSE stream are allowed; null for the same-origin "/api/v1".
export const apiOriginOf = (apiUrl: string | undefined): string | null => {
  if (!apiUrl) return null;
  try {
    return new URL(apiUrl).origin;
  } catch {
    return null;
  }
};

export const createNonce = (): string =>
  btoa(crypto.randomUUID()).replace(/=+$/, "");

interface CspOptions {
  nonce: string;
  apiOrigin: string | null;
  isDev: boolean;
}

export const buildCsp = ({ nonce, apiOrigin, isDev }: CspOptions): string => {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      // React's dev build (HMR, error overlay) evaluates code.
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", ...IMAGE_HOSTS],
    "connect-src": ["'self'", ...(apiOrigin ? [apiOrigin] : [])],
    "font-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };

  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(" ")}`)
    .join("; ");
};
