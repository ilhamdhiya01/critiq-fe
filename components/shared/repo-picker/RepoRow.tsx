"use client";

import classNames from "classnames";
import React, { useCallback, useEffect, useState } from "react";

import Checkbox from "@/components/ui/checkbox";
import Icon from "@/components/ui/icon/Icon";
import { useIntegrationRepoBranches } from "@/lib/hooks/integrations/useIntegrationRepoBranches";
import { useDebounce } from "@/lib/hooks/useDebounce";
import type {
  IntegrationSource,
  RepoCandidate,
} from "@/lib/types/integration.types";

import BranchMultiSelect from "./BranchMultiSelect";

export interface BranchFetchStatus {
  isFetching: boolean;
  isError: boolean;
}

interface RepoRowProps {
  repo: RepoCandidate;
  checked: boolean;
  onToggle: (id: number) => void;
  source: IntegrationSource;
  organizationId: string;
  selectedBranches: Record<string, boolean> | undefined;
  onToggleBranch: (repoId: string, branch: string) => void;
  onBranchesReady: (repoId: string, defaultBranch: string) => void;
  onBranchStatusChange: (repoId: string, status: BranchFetchStatus) => void;
  isConnected?: boolean;
  error?: string;
}

const RepoRow = React.memo(
  ({
    repo,
    checked,
    onToggle,
    source,
    organizationId,
    selectedBranches,
    onToggleBranch,
    onBranchesReady,
    onBranchStatusChange,
    isConnected = false,
    error,
  }: RepoRowProps) => {
    const repoId = String(repo.id);
    const [query, setQuery] = useState("");
    const debouncedQuery = useDebounce(query, 300);

    const {
      data: branchData,
      isFetching: isBranchesFetching,
      isError: isBranchesError,
      refetch: refetchBranches,
    } = useIntegrationRepoBranches(
      organizationId,
      source,
      repo.id,
      checked,
      debouncedQuery,
    );

    useEffect(() => {
      onBranchStatusChange(repoId, {
        isFetching: isBranchesFetching,
        isError: isBranchesError,
      });
    }, [repoId, isBranchesFetching, isBranchesError, onBranchStatusChange]);

    // Buka-tutup repo yang sama tidak boleh membawa kata kunci lama.
    useEffect(() => {
      if (!checked) setQuery("");
    }, [checked]);

    useEffect(() => {
      if (branchData && selectedBranches === undefined) {
        onBranchesReady(repoId, branchData.defaultBranch);
      }
    }, [branchData, selectedBranches, repoId, onBranchesReady]);

    const handleToggleBranch = useCallback(
      (branch: string) => onToggleBranch(repoId, branch),
      [onToggleBranch, repoId],
    );

    const handleRetry = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        refetchBranches();
      },
      [refetchBranches],
    );

    return (
      <div
        className={classNames(
          "flex flex-col border-b border-border-row last:border-b-0",
          { "bg-green-500/4": checked },
        )}
      >
        <div
          onClick={isConnected ? undefined : () => onToggle(repo.id)}
          className={classNames("flex items-center gap-3 px-3.5 py-2.5", {
            "cursor-pointer": !isConnected,
            "cursor-default opacity-60": isConnected,
          })}
        >
          <Checkbox checked={checked} disabled={isConnected} readOnly />
          <span className="flex-1 font-mono text-[12.5px] text-neutral-100">
            {repo.path}
          </span>
          {isConnected && (
            <span className="rounded-full border border-success/40 bg-success/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-success-light">
              Connected
            </span>
          )}
          <span className="flex items-center gap-1.5 text-[11px] text-text-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-info" />
            {repo.lang}
          </span>
          <span className="rounded-full border border-border-default px-2 py-0.5 font-mono text-[10px] text-text-secondary capitalize">
            {repo.visibility}
          </span>
        </div>

        {error && (
          <div className="flex items-center gap-1.5 px-3.5 pb-2.5 text-[11px] text-danger-light">
            <Icon icon="TbAlertTriangle" size={13} />
            {error}
          </div>
        )}

        {checked && !branchData && isBranchesFetching && (
          <div className="px-3.5 pb-2.5 font-mono text-[11px] text-text-muted">
            Loading branches…
          </div>
        )}

        {checked && isBranchesError && !isBranchesFetching && (
          <div className="flex items-center gap-1.5 px-3.5 pb-2.5 text-[11px] text-danger">
            <Icon icon="TbAlertTriangle" size={13} />
            Failed to load branches —{" "}
            <button
              type="button"
              onClick={handleRetry}
              className="underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        )}

        {checked && branchData && !isBranchesError && (
          <div className="px-3.5 pb-2.5">
            <BranchMultiSelect
              branches={branchData.branches}
              defaultBranch={branchData.defaultBranch}
              total={branchData.total}
              truncated={branchData.truncated}
              selected={selectedBranches ?? {}}
              onToggle={handleToggleBranch}
              query={query}
              onQueryChange={setQuery}
              isRefreshing={isBranchesFetching}
            />
          </div>
        )}
      </div>
    );
  },
);

RepoRow.displayName = "RepoRow";

export default RepoRow;
