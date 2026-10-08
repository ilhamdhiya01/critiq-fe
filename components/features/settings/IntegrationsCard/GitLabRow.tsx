"use client";

import React, { useCallback, useState } from "react";

import Button from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import { GITLAB_DEFAULT_INSTANCE_URL } from "@/const/integration.constant";
import { formatDate, getDaysUntil } from "@/lib/helpers/date.helper";
import {
  formatConnectedRepoCount,
  formatDayCount,
  getIntegrationStatus,
  hostOf,
} from "@/lib/helpers/integration.helper";
import { useCheckGitLabHealth } from "@/lib/hooks/integrations/useCheckGitLabHealth";
import { useDisconnectGitlab } from "@/lib/hooks/integrations/useDisconnectGitlab";
import type { Integration } from "@/lib/types/integration.types";

import SettingsChip from "../SettingsChip";
import ConnectRepositoriesAction from "./ConnectRepositoriesAction";
import GitLabConnectModal from "./GitLabConnectModal";
import NoReposHint from "./NoReposHint";
import StatusBanner from "./StatusBanner";

type ModalMode = "connect" | "replace";

interface GitLabRowProps {
  orgId: string;
  integration: Integration | null;
  repoCount: number | undefined;
  isAdmin: boolean;
}

const getExpiryLabel = (expiresAt: string): string => {
  const days = getDaysUntil(expiresAt);
  const remaining = days < 0 ? "expired" : `${formatDayCount(days)} left`;
  return `expires ${formatDate(expiresAt)} (${remaining})`;
};

const GitLabRow = React.memo(
  ({ orgId, integration, repoCount, isAdmin }: GitLabRowProps) => {
    const [modalMode, setModalMode] = useState<ModalMode | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const { handleCheckGitLabHealth, isChecking } = useCheckGitLabHealth(orgId);
    const { handleDisconnectGitlab, isDisconnecting } =
      useDisconnectGitlab(orgId);

    const handleCloseModal = useCallback(() => setModalMode(null), []);
    const handleCloseConfirm = useCallback(() => setIsConfirmOpen(false), []);

    const handleDisconnect = async () => {
      try {
        await handleDisconnectGitlab();
      } catch {
        // Shown as a toast by useDisconnectGitlab.
      } finally {
        setIsConfirmOpen(false);
      }
    };

    const status = integration ? getIntegrationStatus(integration) : null;
    const detailParts = integration
      ? [
          integration.tokenLast4 && `••••${integration.tokenLast4}`,
          integration.expiresAt && getExpiryLabel(integration.expiresAt),
          repoCount !== undefined && formatConnectedRepoCount(repoCount),
        ].filter(Boolean)
      : [];
    // Defined only when the Admin may connect repos and the count has loaded.
    const adminRepoCount = isAdmin && integration ? repoCount : undefined;

    return (
      <>
        <div className="flex flex-col gap-3 py-2.5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[13px] font-semibold text-neutral-100">
                GitLab
              </span>
              {integration ? (
                <>
                  <span className="flex flex-wrap items-center gap-2 font-mono text-[11.5px] text-text-faint">
                    <span>
                      {integration.instanceUrl &&
                        hostOf(integration.instanceUrl)}
                      {integration.tokenUsername &&
                        ` · ${integration.tokenUsername}`}
                    </span>
                    {integration.tokenKind === "GROUP" && (
                      <SettingsChip>Group token</SettingsChip>
                    )}
                  </span>
                  {detailParts.length > 0 && (
                    <span className="font-mono text-[11.5px] text-text-faint">
                      {detailParts.join(" · ")}
                    </span>
                  )}
                  {/* TODO: show webhook status once the BE exposes a `webhook` field. */}
                  <span className="text-[11px] text-text-muted">
                    Webhooks managed automatically
                  </span>
                  {integration.tokenKind === "PERSONAL" && (
                    <span className="text-[11px] text-warning-light">
                      Personal token — stops working when that account&apos;s
                      owner leaves
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[11.5px] text-text-faint">
                  GitLab.com or self-hosted
                </span>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2.5">
              {status && (
                <SettingsChip tone={status.tone}>
                  {status.label.toUpperCase()}
                </SettingsChip>
              )}
              {isAdmin && !integration && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  fullWidth={false}
                  onClick={() => setModalMode("connect")}
                >
                  Connect
                </Button>
              )}
            </div>
          </div>

          {status?.message && status.tone !== "green" && (
            <StatusBanner tone={status.tone} message={status.message} />
          )}

          {adminRepoCount === 0 && (
            <NoReposHint orgId={orgId} provider="GITLAB" />
          )}

          {isAdmin && integration && (
            <div className="flex flex-wrap gap-2.5">
              {adminRepoCount !== undefined && adminRepoCount > 0 && (
                <ConnectRepositoriesAction
                  orgId={orgId}
                  provider="GITLAB"
                  label="Connect more"
                  variant="ghost"
                />
              )}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                fullWidth={false}
                onClick={() => setModalMode("replace")}
              >
                Replace token
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                fullWidth={false}
                onClick={() => handleCheckGitLabHealth()}
                isLoading={isChecking}
              >
                Check connection
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                fullWidth={false}
                onClick={() => setIsConfirmOpen(true)}
              >
                Disconnect
              </Button>
            </div>
          )}
        </div>

        {modalMode && (
          <GitLabConnectModal
            orgId={orgId}
            isReplace={modalMode === "replace"}
            initialInstanceUrl={
              integration?.instanceUrl ?? GITLAB_DEFAULT_INSTANCE_URL
            }
            onClose={handleCloseModal}
          />
        )}

        <Modal
          isOpen={isConfirmOpen}
          title="Disconnect GitLab"
          onClose={handleCloseConfirm}
          footer={
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                fullWidth={false}
                onClick={handleCloseConfirm}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                fullWidth={false}
                onClick={handleDisconnect}
                isLoading={isDisconnecting}
              >
                Disconnect
              </Button>
            </>
          }
        >
          <p className="text-[12.5px] leading-relaxed text-text-secondary">
            Webhooks on every GitLab repo will be removed and those repos will
            no longer be scanned automatically.
          </p>
        </Modal>
      </>
    );
  },
);

GitLabRow.displayName = "GitLabRow";

export default GitLabRow;
