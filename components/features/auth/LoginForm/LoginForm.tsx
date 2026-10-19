import React from "react";

import Logo from "@/components/shared/logo";
import OAuthButtons from "@/components/shared/oauth-buttons";

const LoginForm = React.memo(() => {
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

      <OAuthButtons className="mt-6" />

      <p className="mt-6.5 text-center text-xs leading-normal text-[#7A7A7A]">
        By logging in, you agree to our{" "}
        <a href="#" className="text-primary-300 hover:underline">
          Terms of Service
        </a>
      </p>
    </>
  );
});

LoginForm.displayName = "LoginForm";

export default LoginForm;
