import React from "react";

import EmptyState from "@/components/shared/empty-state";
import SectionMessage from "@/components/shared/section-message";
import Skeleton from "@/components/ui/skeleton";
import type { DashboardCriticalIssue } from "@/lib/types/dashboard.types";
import type { IntegrationProvider } from "@/lib/types/integration.types";

import CriticalIssueItem from "./CriticalIssueItem";

interface CriticalIssueListProps {
  issues: DashboardCriticalIssue[] | undefined;
  isLoading: boolean;
  isError: boolean;
  providers: Map<string, IntegrationProvider>;
  slug: string;
}

// Shared by the card (5 items) and the "View all" modal (50 items).
const CriticalIssueList = React.memo(
  ({ issues, isLoading, isError, providers, slug }: CriticalIssueListProps) => {
    if (isError) {
      return (
        <SectionMessage tone="danger">
          Couldn&apos;t load critical issues.
        </SectionMessage>
      );
    }
    if (isLoading) {
      return (
        <div className="flex flex-col gap-2 px-5 py-4">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-4/5 rounded" />
        </div>
      );
    }
    if (!issues || issues.length === 0) {
      return (
        <EmptyState
          icon="TbShieldCheck"
          title="No critical issues in open PRs"
          description="Nothing critical is waiting on a fix right now."
        />
      );
    }

    return (
      <ul>
        {issues.map((issue) => (
          <CriticalIssueItem
            key={issue.findingId}
            issue={issue}
            provider={providers.get(issue.pull.repoId)}
            slug={slug}
          />
        ))}
      </ul>
    );
  },
);

CriticalIssueList.displayName = "CriticalIssueList";

export default CriticalIssueList;
