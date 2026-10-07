"use client";

import React, { useCallback, useState } from "react";

import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Modal from "@/components/ui/modal";
import { useConnectGitLab } from "@/lib/hooks/integrations/useConnectGitLab";

const FORM_ID = "gitlab-connect-form";

interface GitLabConnectModalProps {
  orgId: string;
  isReplace: boolean;
  initialInstanceUrl: string;
  onClose: () => void;
}

const GitLabConnectModal = React.memo(
  ({
    orgId,
    isReplace,
    initialInstanceUrl,
    onClose,
  }: GitLabConnectModalProps) => {
    const [instanceUrl, setInstanceUrl] = useState(initialInstanceUrl);
    const [token, setToken] = useState("");

    const {
      handleConnectGitLab,
      isConnecting,
      connectFieldErrors,
      clearConnectFieldErrors,
    } = useConnectGitLab(orgId);

    const handleClose = useCallback(() => {
      clearConnectFieldErrors();
      onClose();
    }, [clearConnectFieldErrors, onClose]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const submittedToken = token;
      // The token never outlives the request in component state.
      setToken("");
      const isConnected = await handleConnectGitLab({
        instanceUrl: instanceUrl.trim(),
        token: submittedToken,
      });
      if (isConnected) onClose();
    };

    const isSubmitDisabled = !instanceUrl.trim() || !token || isConnecting;

    return (
      <Modal
        isOpen
        title={isReplace ? "Replace GitLab token" : "Connect GitLab"}
        onClose={handleClose}
        footer={
          <Button
            type="submit"
            form={FORM_ID}
            variant="primary"
            size="sm"
            fullWidth={false}
            disabled={isSubmitDisabled}
            isLoading={isConnecting}
          >
            {isReplace ? "Replace token" : "Connect"}
          </Button>
        }
      >
        <form
          id={FORM_ID}
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10.5px] tracking-[.06em] text-text-muted uppercase">
              Instance URL
            </span>
            <Input
              value={instanceUrl}
              onChange={(e) => {
                setInstanceUrl(e.target.value);
                clearConnectFieldErrors();
              }}
              placeholder="https://gitlab.com"
              error={connectFieldErrors.instance_url}
              className="font-mono text-[12.5px]"
            />
            {connectFieldErrors.instance_url && (
              <span className="text-[11px] text-danger-light">
                {connectFieldErrors.instance_url}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10.5px] tracking-[.06em] text-text-muted uppercase">
              Access token
            </span>
            <Input
              type="password"
              autoComplete="off"
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                clearConnectFieldErrors();
              }}
              placeholder="glpat-••••••••••••••••"
              error={connectFieldErrors.token}
              className="font-mono text-[12.5px]"
            />
            {connectFieldErrors.token && (
              <span className="text-[11px] text-danger-light">
                {connectFieldErrors.token}
              </span>
            )}
            <span className="text-[11px] leading-normal text-text-faint">
              Needs the{" "}
              <span className="font-mono text-text-secondary">api</span> scope
              and the{" "}
              <span className="font-mono text-text-secondary">Maintainer</span>{" "}
              role on at least one project. A group access token is recommended.
            </span>
          </div>
        </form>
      </Modal>
    );
  },
);

GitLabConnectModal.displayName = "GitLabConnectModal";

export default GitLabConnectModal;
