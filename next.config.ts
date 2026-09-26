import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    // next/image refuses any host not listed here. Avatars come from whichever
    // provider the user signed in with, so every avatar host has to be allowed
    // or the profile menu crashes the page it renders on.
    remotePatterns: [
      // GitHub
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      // GitLab — uploaded avatars on gitlab.com, and Gravatar for the
      // identicon fallback it serves when a user has not set one.
      { protocol: "https", hostname: "gitlab.com" },
      { protocol: "https", hostname: "secure.gravatar.com" },
      { protocol: "https", hostname: "www.gravatar.com" },
    ],
  },
};

export default nextConfig;
