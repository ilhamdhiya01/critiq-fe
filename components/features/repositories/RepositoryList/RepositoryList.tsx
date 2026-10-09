"use client";

import classNames from "classnames";
import Link from "next/link";
import { useParams } from "next/navigation";
import React from "react";

import StateStatus from "@/components/shared/state-status";
import { languageDotClass, repoName } from "@/lib/helpers/repository.helper";
import { useOrgRepositories } from "@/lib/hooks/repositories/useOrgRepositories";
import type { OrgRepository } from "@/lib/types/repository.types";
import { ROUTES } from "@/routes";

const SKELETON_CARDS = 3;

interface RepositoryCardProps {
  repo: OrgRepository;
  href: string;
}

// Real data only: no quality gate or rating until the BE ships them.
const RepositoryCard = React.memo(({ repo, href }: RepositoryCardProps) => {
  const hasFooter =
    repo.openCriticalCount !== undefined || repo.openPullCount !== undefined;

  return (
    <Link
      href={href}
      title={repo.path}
      className="flex flex-col gap-3.5 rounded-lg border border-border-subtle bg-surface px-5 py-4.5 transition-colors hover:border-border-default hover:bg-raised"
    >
      <span className="truncate font-mono text-[14px] font-semibold text-neutral-50">
        {repoName(repo.path)}
      </span>

      {repo.language && (
        <span className="flex items-center gap-2 text-[12px] text-text-secondary">
          <span
            data-testid="language-dot"
            className={classNames(
              "h-2 w-2 rounded-full",
              languageDotClass(repo.language),
            )}
          />
          {repo.language}
        </span>
      )}

      {hasFooter && (
        <span className="mt-auto flex items-center justify-between gap-3 border-t border-border-row pt-3.5 font-mono text-[12px]">
          {repo.openCriticalCount !== undefined && (
            <span
              className={classNames({
                "text-danger-light": repo.openCriticalCount > 0,
                "text-text-muted": repo.openCriticalCount === 0,
              })}
            >
              {repo.openCriticalCount} critical
            </span>
          )}
          {repo.openPullCount !== undefined && (
            <span className="text-text-secondary">
              {repo.openPullCount} open{" "}
              {repo.openPullCount === 1 ? "PR" : "PRs"}
            </span>
          )}
        </span>
      )}
    </Link>
  );
});

RepositoryCard.displayName = "RepositoryCard";

interface RepositoryListProps {
  orgId?: string;
}

const RepositoryList = React.memo(({ orgId }: RepositoryListProps) => {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { data: repositories, isLoading, isError } = useOrgRepositories(orgId);

  if (isError) {
    return (
      <StateStatus
        title="Couldn't load repositories"
        description="Something went wrong while loading repositories. Reload the page to try again."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="animate-shimmer h-4 w-80 rounded" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: SKELETON_CARDS }, (_, index) => (
            <div key={index} className="animate-shimmer h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!repositories || repositories.length === 0) {
    return (
      <StateStatus
        title="No repositories connected yet"
        description="Connect repositories from Settings → Integrations to start scanning pull requests."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] text-text-secondary">
        {repositories.length}{" "}
        {repositories.length === 1 ? "repository" : "repositories"} connected ·
        every pull request is scanned on push
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {repositories.map((repo) => (
          <RepositoryCard
            key={repo.id}
            repo={repo}
            href={ROUTES.repositoryDetail(slug, repo.id)}
          />
        ))}
      </div>
    </div>
  );
});

RepositoryList.displayName = "RepositoryList";

export default RepositoryList;
