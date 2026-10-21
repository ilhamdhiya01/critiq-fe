import classNames from "classnames";
import Link from "next/link";
import React from "react";

import { PULL_REQUEST_NUMBER_PREFIX } from "@/const/pull-request.constant";
import { PROVIDER_NAME } from "@/const/repository.constant";
import { formatRelativeTime } from "@/lib/helpers/date.helper";
import { repoName } from "@/lib/helpers/repository.helper";
import type { ReviewActivityItem } from "@/lib/types/activity.types";
import type { IntegrationProvider } from "@/lib/types/integration.types";
import { ROUTES } from "@/routes";

const VERB = {
  approve: { text: "approved", className: "text-success-light" },
  request_changes: {
    text: "requested changes",
    className: "text-warning-light",
  },
} as const;

interface ActivityTimelineItemProps {
  item: ReviewActivityItem;
  provider: IntegrationProvider | undefined;
  slug: string;
  // The last item of a day group draws no connector below its dot.
  isLast: boolean;
}

const ActivityTimelineItem = React.memo(
  ({ item, provider, slug, isLast }: ActivityTimelineItemProps) => {
    const verb = VERB[item.decision];
    const prHref = ROUTES.pullRequestDetail(
      slug,
      item.pull.id,
      item.pull.repoId,
    );

    return (
      <li className="flex gap-4">
        <span className="flex flex-col items-center pt-1">
          <span
            aria-hidden
            className={classNames(
              "h-4 w-4 shrink-0 rounded-full border-2",
              item.decision === "approve"
                ? "border-success-light"
                : "border-warning-light",
            )}
          />
          {/* Runs into the next item's dot (which sits 4px down via pt-1). */}
          {!isLast && (
            <span className="mt-1 -mb-1 w-px flex-1 bg-neutral-700" />
          )}
        </span>

        <div
          className={classNames("flex min-w-0 flex-col gap-1", {
            "pb-7": !isLast,
          })}
        >
          <p className="text-[14px] leading-snug wrap-anywhere">
            {item.reviewer ? (
              <span className="font-semibold text-neutral-50">
                {item.reviewer.name}
              </span>
            ) : (
              <span className="text-text-muted italic">Deleted user</span>
            )}{" "}
            <span className={verb.className}>{verb.text}</span>{" "}
            <Link
              href={prHref}
              title={item.pull.title}
              className="font-mono text-primary-300 hover:underline"
            >
              {PULL_REQUEST_NUMBER_PREFIX[provider ?? "GITHUB"]}
              {item.pull.number}
            </Link>{" "}
            <span
              title={item.pull.repoPath}
              className="font-mono text-primary-300"
            >
              · {repoName(item.pull.repoPath)}
            </span>
          </p>
          <p className="font-mono text-[12px] text-text-muted">
            {item.aiAssisted ? "AI-Assisted" : "Manual"} ·{" "}
            {formatRelativeTime(item.createdAt)}
            {item.sync.status === "failed" && (
              <span className="text-warning-light">
                {" "}
                · not synced to {PROVIDER_NAME[provider ?? "GITHUB"]}
              </span>
            )}
          </p>
        </div>
      </li>
    );
  },
);

ActivityTimelineItem.displayName = "ActivityTimelineItem";

export default ActivityTimelineItem;
