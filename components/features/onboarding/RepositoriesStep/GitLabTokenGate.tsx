"use client";

import React, { useCallback, useState } from "react";

import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { useVerifyGitLabToken } from "@/lib/hooks/integrations/useVerifyGitLabToken";
import type { VerifyGitLabTokenErrorCode } from "@/lib/types/integration.types";

// TODO: gantikan dengan orgId nyata setelah Organization step (POST /orgs) tersambung.
const PENDING_ORG_ID = "pending-org";

const TOKEN_FIELD_ERROR_CODES: VerifyGitLabTokenErrorCode[] = [
  "token_invalid",
  "scope_missing",
  "no_maintainer_project",
];

const TOKEN_ERROR_MESSAGE: Record<VerifyGitLabTokenErrorCode, string> = {
  token_invalid: "Token tidak valid. Periksa kembali token yang ditempel.",
  scope_missing: "Token tidak memiliki scope api yang dibutuhkan.",
  no_maintainer_project:
    "Token ini tidak punya akses Maintainer ke project manapun.",
  instance_unreachable: "Instance URL tidak bisa dijangkau.",
};

interface GitLabTokenGateProps {
  onVerified: () => void;
}

const GitLabTokenGate = React.memo(({ onVerified }: GitLabTokenGateProps) => {
  const [instanceUrl, setInstanceUrl] = useState("https://gitlab.com");
  const [token, setToken] = useState("");

  const { handleVerifyGitLabToken, isVerifying, verifyErrorCode } =
    useVerifyGitLabToken(PENDING_ORG_ID);

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
    try {
      await handleVerifyGitLabToken({
        instanceUrl: instanceUrl.trim(),
        token: token.trim(),
      });
      onVerified();
    } catch {
      // error ditampilkan lewat verifyErrorCode di bawah field terkait
    }
  }, [handleVerifyGitLabToken, instanceUrl, token, onVerified]);

  const instanceUrlError =
    verifyErrorCode === "instance_unreachable"
      ? TOKEN_ERROR_MESSAGE[verifyErrorCode]
      : undefined;
  const tokenError =
    verifyErrorCode && TOKEN_FIELD_ERROR_CODES.includes(verifyErrorCode)
      ? TOKEN_ERROR_MESSAGE[verifyErrorCode]
      : undefined;

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
        Group access token direkomendasikan untuk akses tim. Personal access
        token juga diterima.
      </p>

      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[10.5px] tracking-[.06em] text-text-secondary uppercase">
          Instance URL
        </span>
        <Input
          value={instanceUrl}
          onChange={handleInstanceUrlChange}
          error={instanceUrlError}
        />
        {instanceUrlError ? (
          <p className="text-[11px] text-danger">{instanceUrlError}</p>
        ) : (
          <p className="text-[11px] text-text-muted">
            Keep gitlab.com unless your team runs a self-hosted instance.
          </p>
        )}
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
          error={tokenError}
        />
        {tokenError ? (
          <p className="text-[11px] text-danger">{tokenError}</p>
        ) : (
          <p className="text-[11px] text-text-muted">
            Group or personal access token · role Maintainer · scope api. GitLab
            enforces expiry — Critiq warns Admins 14 days before.
          </p>
        )}
      </div>

      <Button
        size="md"
        isLoading={isVerifying}
        disabled={!canVerify}
        onClick={handleVerifyClick}
      >
        Verify & load projects
      </Button>
    </div>
  );
});

GitLabTokenGate.displayName = "GitLabTokenGate";

export default GitLabTokenGate;
