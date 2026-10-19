"use client";

import classNames from "classnames";
import React, { useState } from "react";

import Button from "@/components/ui/button";
import { API_OAUTH_LOGIN } from "@/routes";

const GitHubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#F0F0F0">
    <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.36-3.37-1.36-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2z" />
  </svg>
);

const GitLabIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path fill="#E24329" d="M12 22.5l3.6-11h-7.2z" />
    <path fill="var(--color-vendor-gitlab)" d="M12 22.5l-3.6-11H2.7z" />
    <path fill="#FCA326" d="M2.7 11.5L1.4 15.4a.9.9 0 0 0 .33 1L12 22.5z" />
    <path fill="#E24329" d="M2.7 11.5H8.4L6 4.2a.42.42 0 0 0-.8 0z" />
    <path fill="var(--color-vendor-gitlab)" d="M12 22.5l3.6-11h5.7z" />
    <path fill="#FCA326" d="M21.3 11.5l1.3 3.9a.9.9 0 0 1-.33 1L12 22.5z" />
    <path fill="#E24329" d="M21.3 11.5H15.6L18 4.2a.42.42 0 0 1 .8 0z" />
  </svg>
);

interface OAuthButtonsProps {
  // e.g. "Continue with" (login) or "Sign in with" (invite page).
  verb?: string;
  className?: string;
}

type Provider = "github" | "gitlab";

// GitHub / GitLab sign-in buttons. They leave the app for the BE OAuth flow,
// so the pressed one keeps spinning until the page unloads.
const OAuthButtons = React.memo(
  ({ verb = "Continue with", className }: OAuthButtonsProps) => {
    const [pressed, setPressed] = useState<Provider | null>(null);

    return (
      <div className={classNames("flex flex-col gap-3", className)}>
        <Button
          link={API_OAUTH_LOGIN("github")}
          isLoading={pressed === "github"}
          disabled={pressed === "gitlab"}
          variant="provider"
          icon={<GitHubIcon />}
          className="py-2.75"
          onClick={() => setPressed("github")}
        >
          {verb} GitHub
        </Button>
        <Button
          link={API_OAUTH_LOGIN("gitlab")}
          isLoading={pressed === "gitlab"}
          disabled={pressed === "github"}
          variant="provider"
          icon={<GitLabIcon />}
          className="py-2.75"
          onClick={() => setPressed("gitlab")}
        >
          {verb} GitLab.com
        </Button>
      </div>
    );
  },
);

OAuthButtons.displayName = "OAuthButtons";

export default OAuthButtons;
