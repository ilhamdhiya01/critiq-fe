"use client";

import React, { useCallback, useState } from "react";

import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Modal from "@/components/ui/modal";

const IntegrationsCard = React.memo(() => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [instanceUrl, setInstanceUrl] = useState("https://gitlab.com");
  const [accessToken, setAccessToken] = useState("");

  const handleOpenModal = useCallback(() => setIsModalOpen(true), []);
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setInstanceUrl("https://gitlab.com");
    setAccessToken("");
  }, []);
  const handleConnect = useCallback(() => setIsModalOpen(false), []);

  const isConnectDisabled = !instanceUrl.trim() || !accessToken.trim();

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface p-5">
      <span className="font-mono text-[13px] font-semibold text-text-strong">
        Integrations
      </span>

      <div className="flex items-center justify-between py-1">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-semibold text-neutral-100">
            GitHub
          </span>
          <span className="font-mono text-[11px] text-text-secondary">
            org: cititex · 6 repos · webhook active
          </span>
        </div>
        <span className="rounded-full border border-success/40 bg-success/10 px-2.5 py-0.5 font-mono text-[10.5px] font-semibold text-success">
          CONNECTED
        </span>
      </div>

      <div className="flex items-center justify-between border-t border-border-row py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-semibold text-neutral-100">
            GitLab
          </span>
          <span className="text-[11.5px] text-text-secondary">
            PR scanning for self-hosted GitLab instances.
          </span>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          fullWidth={false}
          onClick={handleOpenModal}
          className="shrink-0 font-mono"
        >
          Connect
        </Button>
      </div>

      <div className="flex flex-col gap-1.5 border-t border-border-row pt-3.5">
        <span className="text-[12.5px] text-text-secondary">Webhook URL</span>
        <Input
          readOnly
          value="https://critiq.cititex.io/hooks/gh-7f21"
          className="font-mono text-[12px]"
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        title="Connect GitLab"
        onClose={handleCloseModal}
        footer={
          <Button
            variant="primary"
            size="sm"
            fullWidth={false}
            onClick={handleConnect}
            disabled={isConnectDisabled}
          >
            Connect
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10.5px] tracking-[.06em] text-text-muted uppercase">
              Instance URL
            </span>
            <Input
              value={instanceUrl}
              onChange={(e) => setInstanceUrl(e.target.value)}
              placeholder="https://gitlab.com"
              className="font-mono text-[12.5px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10.5px] tracking-[.06em] text-text-muted uppercase">
              Access Token
            </span>
            <Input
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="glpat-••••••••••••••••"
              className="font-mono text-[12.5px]"
            />
            <span className="text-[11px] text-text-faint">
              Group access token recommended (personal works too) · role{" "}
              <span className="font-mono text-text-secondary">Maintainer</span>{" "}
              · scope <span className="font-mono text-text-secondary">api</span>
              . GitLab enforces expiry — Critiq warns Admins 14 days before.
            </span>
          </div>
        </div>
      </Modal>
    </div>
  );
});

IntegrationsCard.displayName = "IntegrationsCard";

export default IntegrationsCard;
