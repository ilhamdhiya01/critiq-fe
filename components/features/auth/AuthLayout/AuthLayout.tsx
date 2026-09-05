import React from "react";

import Logo from "@/components/shared/logo";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="flex min-h-screen bg-background font-sans text-[13px] text-neutral-100">
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="flex w-90 max-w-full flex-col">{children}</div>
      </div>

      <div
        className="relative hidden items-center overflow-hidden border-l border-border-default min-[900px]:flex min-[900px]:flex-[1.1]"
        style={{
          background:
            "linear-gradient(160deg,#26264F 0%,#1B1B38 55%,#141428 100%)",
        }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.07]">
          <Logo size={640} variant="inverted" />
        </div>

        <div className="relative flex max-w-140 flex-col px-18">
          <h2 className="m-0 text-[30px] leading-tight font-bold tracking-[-.015em] text-neutral-50">
            Every pull request reviewed before a human reads it.
          </h2>
          <p className="mt-4 text-[14.5px] leading-[1.65] text-[#B8BAE0]">
            Critiq runs your rules and quality profiles against every PR, flags
            what matters, and keeps the noise out of review.
          </p>
          <div className="mt-11 flex gap-10 border-t border-[#A5B4FC]/18 pt-7">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xl font-semibold text-[#F0F0F0]">
                2,400+
              </span>
              <span className="text-xs text-[#9295C9]">
                rules across 12 languages
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xl font-semibold text-[#F0F0F0]">
                &lt; 90s
              </span>
              <span className="text-xs text-[#9295C9]">
                median review time per PR
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
