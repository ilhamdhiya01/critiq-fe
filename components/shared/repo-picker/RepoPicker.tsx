"use client";

import classNames from "classnames";
import React, { useCallback, useEffect, useState } from "react";

import type {
  IntegrationSource,
  RepoCandidate,
} from "@/lib/types/integration.types";

import RepoRow, { type BranchFetchStatus } from "./RepoRow";

interface RepoPickerProps {
  organizationId: string;
  source: IntegrationSource;
  candidates: RepoCandidate[] | undefined;
  isLoading: boolean;
  selectedRepos: Record<string, boolean>;
  selectedBranches: Record<string, Record<string, boolean>>;
  onToggleRepo: (id: string) => void;
  onToggleBranch: (repoId: string, branch: string) => void;
  onBranchesReady: (repoId: string, defaultBranch: string) => void;
  // True while a selected repo's branches are loading or failed to load.
  onBlockedChange: (blocked: boolean) => void;
  emptyState: React.ReactNode;
  connectedPaths?: Set<string>;
  rowErrors?: Record<string, string>;
  listClassName?: string;
}

// Controlled repo + branch picker shared by the onboarding wizard and the
// Settings "Connect repositories" modal. Callers fetch the candidates so each
// can handle its own not-connected / error states.
const RepoPicker = React.memo(
  ({
    organizationId,
    source,
    candidates,
    isLoading,
    selectedRepos,
    selectedBranches,
    onToggleRepo,
    onToggleBranch,
    onBranchesReady,
    onBlockedChange,
    emptyState,
    connectedPaths,
    rowErrors,
    listClassName = "max-h-62.5",
  }: RepoPickerProps) => {
    const [branchStatus, setBranchStatus] = useState<
      Record<string, BranchFetchStatus>
    >({});

    const handleToggle = useCallback(
      (id: number) => onToggleRepo(String(id)),
      [onToggleRepo],
    );

    const handleBranchStatusChange = useCallback(
      (repoId: string, status: BranchFetchStatus) => {
        setBranchStatus((prev) => ({ ...prev, [repoId]: status }));
      },
      [],
    );

    const hasBlockingBranchIssue = Object.entries(selectedRepos)
      .filter(([, isSelected]) => isSelected)
      .some(
        ([id]) => branchStatus[id]?.isFetching || branchStatus[id]?.isError,
      );

    useEffect(() => {
      onBlockedChange(hasBlockingBranchIssue);
    }, [hasBlockingBranchIssue, onBlockedChange]);

    if (isLoading) {
      return (
        <div className="rounded-lg border border-border-subtle px-3.5 py-4 text-center text-[12.5px] text-text-secondary">
          Fetching projects…
        </div>
      );
    }

    if (!candidates) return null;

    if (candidates.length === 0) {
      return (
        <div className="rounded-lg border border-border-subtle px-3.5 py-4 text-center text-[12.5px] text-text-secondary">
          {emptyState}
        </div>
      );
    }

    return (
      <div
        className={classNames(
          "overflow-auto rounded-lg border border-border-subtle",
          listClassName,
        )}
      >
        {candidates.map((repo) => (
          <RepoRow
            key={repo.id}
            repo={repo}
            checked={!!selectedRepos[String(repo.id)]}
            onToggle={handleToggle}
            source={source}
            organizationId={organizationId}
            selectedBranches={selectedBranches[String(repo.id)]}
            onToggleBranch={onToggleBranch}
            onBranchesReady={onBranchesReady}
            onBranchStatusChange={handleBranchStatusChange}
            isConnected={connectedPaths?.has(repo.path) ?? false}
            error={rowErrors?.[String(repo.id)]}
          />
        ))}
      </div>
    );
  },
);

RepoPicker.displayName = "RepoPicker";

export default RepoPicker;
