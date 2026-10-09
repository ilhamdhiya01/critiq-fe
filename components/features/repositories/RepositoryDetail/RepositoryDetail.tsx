"use client";

import { useParams } from "next/navigation";
import React from "react";

import BackLink from "@/components/shared/back-link";
import StatCard from "@/components/shared/stat-card";
import StateStatus from "@/components/shared/state-status";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon/Icon";
import LanguageDot from "@/components/ui/language-dot";
import Skeleton from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/helpers/date.helper";
import { repoName } from "@/lib/helpers/repository.helper";
import { useOrgBySlug } from "@/lib/hooks/organisation/useOrgBySlug";
import { useOrgRepositories } from "@/lib/hooks/repositories/useOrgRepositories";
import { useRescanRepo } from "@/lib/hooks/repositories/useRescanRepo";
import { useScanConfig } from "@/lib/hooks/repositories/useScanConfig";
import type { OrgRepository } from "@/lib/types/repository.types";
import { ROUTES } from "@/routes";

import BranchPolicyTable from "./BranchPolicyTable";
import RepoPullsTable from "./RepoPullsTable";
import RepoScanHistory from "./RepoScanHistory";

interface RepositoryHeaderProps {
  orgId: string;
  repo: OrgRepository;
  isAdmin: boolean;
}

const RepositoryHeader = ({ orgId, repo, isAdmin }: RepositoryHeaderProps) => {
  const { handleRescan, isRescanning } = useRescanRepo(orgId, repo.id);

  return (
    <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-border-subtle bg-surface px-5 py-4.5">
      <div className="flex min-w-0 flex-col gap-3">
        <span className="flex min-w-0 items-center gap-2.5" title={repo.path}>
          <LanguageDot language={repo.language} size="lg" />
          <h2 className="truncate font-mono text-[18px] font-semibold text-neutral-50">
            {repoName(repo.path)}
          </h2>
        </span>
        <div className="flex flex-wrap items-center gap-2.5">
          {repo.language && (
            <Badge tone="neutral" shape="tag" size="md" weight="normal">
              {repo.language}
            </Badge>
          )}
          <Badge tone="neutral" shape="tag" size="md" weight="normal">
            default: {repo.defaultBranch}
          </Badge>
          {repo.lastScanAt !== undefined && (
            <span className="text-[11.5px] text-text-faint">
              {repo.lastScanAt
                ? `last scan ${formatRelativeTime(repo.lastScanAt)}`
                : "not scanned yet"}
            </span>
          )}
        </div>
      </div>

      {isAdmin && (
        <Button
          type="button"
          variant="secondary"
          size="md"
          fullWidth={false}
          onClick={() => handleRescan()}
          isLoading={isRescanning}
          icon={<Icon icon="TbRefresh" size={13} />}
        >
          Re-scan open PRs
        </Button>
      )}
    </div>
  );
};

interface RepositoryDetailProps {
  orgId?: string;
  repoId: string;
}

const RepositoryDetail = React.memo(
  ({ orgId, repoId }: RepositoryDetailProps) => {
    const params = useParams<{ slug: string }>();
    const slug = params.slug;
    const { membership } = useOrgBySlug(slug);
    const isAdmin = membership?.role === "ADMIN";

    const {
      data: repos,
      isLoading: isLoadingRepos,
      isError: isReposError,
    } = useOrgRepositories(orgId);
    const {
      data: config,
      isLoading: isLoadingConfig,
      isError: isConfigError,
    } = useScanConfig(orgId, repoId);

    const repo = repos?.find((item) => item.id === repoId);

    const renderBody = () => {
      if (isReposError) {
        return (
          <StateStatus
            title="Couldn't load this repository"
            description="Something went wrong while loading it. Reload the page to try again."
          />
        );
      }
      if (isLoadingRepos) {
        return (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-48 rounded-lg" />
          </div>
        );
      }
      if (!repo || !orgId) {
        return (
          <StateStatus
            title="Repository not found"
            description="It may have been disconnected from this organization."
          />
        );
      }

      const hasStats =
        repo.openCriticalCount !== undefined ||
        repo.openPullCount !== undefined;

      return (
        <>
          <RepositoryHeader orgId={orgId} repo={repo} isAdmin={isAdmin} />

          {hasStats && (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              {repo.openCriticalCount !== undefined && (
                <StatCard
                  label="Critical in open PRs"
                  value={repo.openCriticalCount}
                  isAlert={repo.openCriticalCount > 0}
                />
              )}
              {repo.openPullCount !== undefined && (
                <StatCard
                  label="Open pull requests"
                  value={repo.openPullCount}
                />
              )}
            </div>
          )}

          <RepoPullsTable orgId={orgId} repoId={repo.id} slug={slug} />

          {isConfigError ? (
            <p className="rounded-lg border border-border-subtle bg-surface px-5 py-4 text-[12.5px] text-danger-light">
              Couldn&apos;t load branches and review policies.
            </p>
          ) : isLoadingConfig || !config ? (
            <Skeleton className="h-48 rounded-lg" />
          ) : (
            <BranchPolicyTable
              orgId={orgId}
              repoId={repo.id}
              provider={repo.provider}
              config={config}
              isAdmin={isAdmin}
            />
          )}

          <RepoScanHistory orgId={orgId} repoId={repo.id} slug={slug} />
        </>
      );
    };

    return (
      <div className="mx-auto flex max-w-270 flex-col gap-4">
        <BackLink
          href={ROUTES.repositories(slug)}
          label="Back to Repositories"
        />
        {renderBody()}
      </div>
    );
  },
);

RepositoryDetail.displayName = "RepositoryDetail";

export default RepositoryDetail;
