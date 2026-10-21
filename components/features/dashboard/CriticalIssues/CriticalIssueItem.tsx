import Link from "next/link";
import React from "react";

import Badge from "@/components/ui/badge";
import { formatPullRef } from "@/lib/helpers/dashboard.helper";
import { formatRelativeTime } from "@/lib/helpers/date.helper";
import type { DashboardCriticalIssue } from "@/lib/types/dashboard.types";
import type { IntegrationProvider } from "@/lib/types/integration.types";
import { ROUTES } from "@/routes";

interface CriticalIssueItemProps {
  issue: DashboardCriticalIssue;
  provider: IntegrationProvider | undefined;
  slug: string;
}

const CriticalIssueItem = React.memo(
  ({ issue, provider, slug }: CriticalIssueItemProps) => (
    <li className="border-b border-border-row last:border-b-0">
      <Link
        href={ROUTES.pullRequestDetail(slug, issue.pull.id, issue.pull.repoId)}
        title={`${issue.filePath}:${issue.lineStart}`}
        className="flex items-start gap-3.5 px-5 py-3.5 transition-colors hover:bg-surface-hover"
      >
        <Badge tone="red" className="mt-0.5 tracking-[0.03em]">
          CRITICAL
        </Badge>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[12.5px] text-text-strong">
            {issue.title}
          </span>
          <span className="truncate font-mono text-[11.5px] text-primary-300">
            {formatPullRef(provider, issue.pull.number, issue.pull.repoPath)}
          </span>
        </span>
        <span className="shrink-0 text-[11.5px] text-text-muted">
          {formatRelativeTime(issue.firstSeenAt)}
        </span>
      </Link>
    </li>
  ),
);

CriticalIssueItem.displayName = "CriticalIssueItem";

export default CriticalIssueItem;
