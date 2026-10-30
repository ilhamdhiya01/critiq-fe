import type { NextConfig } from "next";

// Static headers for every response. The full CSP (with a per-request
// nonce) is set by proxy.ts; frame-ancestors is enforced here on its own so
// clickjacking stays blocked while that CSP is still Report-Only. HSTS is set
// at the edge (nginx / Cloudflare), not here.
const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  headers: async () => [
    { source: "/:path*", headers: SECURITY_HEADERS },
    // The invite token is in the URL: never leak it in a Referer. Listed
    // last so it overrides the default above.
    {
      source: "/invite/:path*",
      headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
    },
  ],
  images: {
    // next/image refuses any host not listed here. Avatars come from whichever
    // provider the user signed in with, so every avatar host has to be allowed
    // or the profile menu crashes the page it renders on.
    remotePatterns: [
      // GitHub
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "gitlab.com" },
      { protocol: "https", hostname: "secure.gravatar.com" },
      { protocol: "https", hostname: "www.gravatar.com" },
    ],
  },
};

export default nextConfig;
