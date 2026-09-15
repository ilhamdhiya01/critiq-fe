"use client";

import React, { useCallback, useState } from "react";

import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { useVerifyGitLabToken } from "@/lib/hooks/integrations/useVerifyGitLabToken";
import { toast } from "@/lib/toast";
import type { VerifyGitLabTokenErrorCode } from "@/lib/types/integration.types";

const TOKEN_ERROR_MESSAGE: Record<VerifyGitLabTokenErrorCode, string> = {
  token_invalid: "Token is invalid. Double-check the token you pasted.",
  scope_missing: "Token is missing the required api scope.",
  no_maintainer_project: "This token has no Maintainer access to any project.",
  instance_unreachable: "Instance URL is unreachable.",
  gitlab_not_connected: "GitLab is not connected for this organization.",
};

const messageFor = (code: string) =>
  TOKEN_ERROR_MESSAGE[code as VerifyGitLabTokenErrorCode] ?? code;

interface GitLabTokenGateProps {
  onVerified: (instanceUrl: string) => void;
  orgId: string;
}

const GitLabTokenGate = React.memo(
  ({ onVerified, orgId }: GitLabTokenGateProps) => {
    const [instanceUrl, setInstanceUrl] = useState("https://gitlab.com");
    const [token, setToken] = useState("");

    const { handleVerifyGitLabToken, isVerifying } =
      useVerifyGitLabToken(orgId);

    const handleInstanceUrlChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setInstanceUrl(e.target.value);
      },
      [],
    );

    const handleTokenChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setToken(e.target.value);
      },
      [],
    );

    const handleVerifyClick = useCallback(async () => {
      const trimmedInstanceUrl = instanceUrl.trim();
      await toast.promise(
        handleVerifyGitLabToken({
          instanceUrl: trimmedInstanceUrl,
          token: token.trim(),
        }),
        {
          loading: "Verifying token…",
          success: (response) => {
            const successMessage =
              response.message || "GitLab successfully connected";
            onVerified(trimmedInstanceUrl);
            return successMessage;
          },
          error: (err) => messageFor(err.message),
        },
      );
    }, [handleVerifyGitLabToken, instanceUrl, token, onVerified]);

    const canVerify = instanceUrl.trim().length > 0 && token.trim().length > 0;

    return (
      <div className="flex flex-col gap-3 rounded-lg border border-vendor-gitlab/30 bg-vendor-gitlab/5 p-3.5">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-vendor-gitlab/15 px-2 py-0.5 font-mono text-[10px] tracking-[.06em] text-vendor-gitlab uppercase">
            GitLab
          </span>
          <span className="text-[13px] font-semibold text-neutral-100">
            Connect your GitLab instance
          </span>
        </div>
        <p className="text-[11.5px] leading-normal text-text-muted">
          Critiq lists your projects and installs webhooks with an access token.
          A{" "}
          <span className="font-semibold text-neutral-100">
            group access token
          </span>{" "}
          is recommended — it belongs to the group, so scans keep running when
          people leave. A personal access token works too.
        </p>

        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10.5px] tracking-[.06em] text-text-secondary uppercase">
            Instance URL
          </span>
          <Input
            value={instanceUrl}
            onChange={handleInstanceUrlChange}
            // error={instanceUrlErrorMessage}
          />
          <p className="text-[11px] text-text-muted">
            Keep gitlab.com unless your team runs a self-hosted instance.
          </p>
          {/* {instanceUrlErrorMessage ? (
            <p className="text-[11px] text-danger">{instanceUrlErrorMessage}</p>
          ) : (
            <p className="text-[11px] text-text-muted">
              Keep gitlab.com unless your team runs a self-hosted instance.
            </p>
          )} */}
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10.5px] tracking-[.06em] text-text-secondary uppercase">
            Access Token
          </span>
          <Input
            type="password"
            value={token}
            onChange={handleTokenChange}
            placeholder="glpat-••••••••••••••••"
            // error={tokenErrorMessage}
          />
          <p className="text-[11px] text-text-muted">
            Group or personal access token · role Maintainer · scope api. GitLab
            enforces expiry — Critiq warns Admins 14 days before.{" "}
            <a href="#" className="text-primary-300 hover:underline">
              How to create one
            </a>
          </p>
          {/* {tokenErrorMessage ? (
            <p className="text-[11px] text-danger">{tokenErrorMessage}</p>
          ) : (
           
          )} */}
        </div>

        <div className="flex justify-end">
          <Button
            size="md"
            fullWidth={false}
            isLoading={isVerifying}
            disabled={!canVerify}
            onClick={handleVerifyClick}
          >
            Verify & load projects
          </Button>
        </div>
      </div>
    );
  },
);

GitLabTokenGate.displayName = "GitLabTokenGate";

export default GitLabTokenGate;
