"use client";

import React from "react";

import Logo from "@/components/shared/logo";
import Button from "@/components/ui/button";

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

const LoginForm = () => {
  return (
    <>
      <Logo size={30} withWordmark />

      <h1 className="mt-7 text-[22px] font-semibold tracking-[-.01em] text-neutral-50">
        Welcome to Critiq
      </h1>
      <p className="mt-2 text-[13px] leading-normal text-text-secondary">
        Connect your code host to log in or create an account.
      </p>

      <div className="mt-7 flex items-center gap-3">
        <div className="h-px flex-1 bg-border-default" />
        <span className="text-xs whitespace-nowrap text-[#7A7A7A]">
          Log in / sign up with
        </span>
        <div className="h-px flex-1 bg-border-default" />
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <Button variant="provider" icon={<GitHubIcon />} className="py-2.75">
          Continue with GitHub
        </Button>
        <Button variant="provider" icon={<GitLabIcon />} className="py-2.75">
          Continue with GitLab
        </Button>
      </div>

      <p className="mt-6.5 text-center text-xs leading-normal text-[#7A7A7A]">
        By logging in, you agree to our{" "}
        <a href="#" className="text-primary-300 hover:underline">
          Terms of Service
        </a>
        .
      </p>
    </>
  );
};

export default LoginForm;
