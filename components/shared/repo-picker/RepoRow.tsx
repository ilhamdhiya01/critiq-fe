"use client";

import classNames from "classnames";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";

import Badge from "@/components/ui/badge";
import Checkbox from "@/components/ui/checkbox";
import FieldError from "@/components/ui/field-error";
import LanguageDot from "@/components/ui/language-dot";
import { GITHUB_ACCESS_REMOVED_MESSAGE } from "@/const/integration.constant";
import {
  getErrorCode,
  isGitHubAccessError,
} from "@/lib/helpers/integration.helper";
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
  // Settings page of an already connected repo ("Edit settings" link).
  settingsHref?: string;
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
    settingsHref,
    error,
  }: RepoRowProps) => {
    const repoId = String(repo.id);
    const [query, setQuery] = useState("");
    const debouncedQuery = useDebounce(query, 300);

    const {
      data: branchData,
      isFetching: isBranchesFetching,
      isError: isBranchesError,
      error: branchesError,
      refetch: refetchBranches,
    } = useIntegrationRepoBranches(
      organizationId,
      source,
      repo.id,
      checked,
      debouncedQuery,
    );

    const hasGitHubAccessError = isGitHubAccessError(
      getErrorCode(branchesError),
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
            "cursor-default": isConnected,
          })}
        >
          <Checkbox
            checked={checked}
            disabled={isConnected}
            readOnly
            className={classNames("shrink-0", { "opacity-60": isConnected })}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span
              title={repo.path}
              className={classNames(
                "truncate font-mono text-[12.5px] text-neutral-100",
                { "opacity-60": isConnected },
              )}
            >
              {repo.path}
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-text-secondary">
              {repo.lang && (
                <>
                  <LanguageDot language={repo.lang} size="sm" />
                  {repo.lang}
                  <span className="text-text-faint">·</span>
                </>
              )}
              <span className="capitalize">{repo.visibility}</span>
            </span>
          </div>
          {isConnected && (
            <div className="flex shrink-0 items-center gap-2.5">
              <Badge tone="green">Connected</Badge>
              {settingsHref && (
                <Link
                  href={settingsHref}
                  className="text-[11px] whitespace-nowrap text-info-light hover:underline"
                >
                  Edit settings
                </Link>
              )}
            </div>
          )}
        </div>

        {error && <FieldError className="px-3.5 pb-2.5">{error}</FieldError>}

        {checked && !branchData && isBranchesFetching && (
          <div className="px-3.5 pb-2.5 font-mono text-[11px] text-text-muted">
            Loading branches…
          </div>
        )}

        {checked &&
          isBranchesError &&
          !isBranchesFetching &&
          hasGitHubAccessError && (
            <FieldError tone="warning" className="px-3.5 pb-2.5">
              {GITHUB_ACCESS_REMOVED_MESSAGE}
            </FieldError>
          )}

        {checked &&
          isBranchesError &&
          !isBranchesFetching &&
          !hasGitHubAccessError && (
            <FieldError className="px-3.5 pb-2.5">
              Failed to load branches —{" "}
              <button
                type="button"
                onClick={handleRetry}
                className="underline underline-offset-2"
              >
                Retry
              </button>
            </FieldError>
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
