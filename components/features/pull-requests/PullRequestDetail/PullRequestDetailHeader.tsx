import React from "react";

import Avatar from "@/components/ui/avatar";
import Badge from "@/components/ui/badge";
import Icon from "@/components/ui/icon/Icon";
import {
  PULL_REQUEST_NUMBER_PREFIX,
  PULL_REQUEST_POLICY_LABEL,
  PULL_REQUEST_POLICY_STYLE,
  PULL_REQUEST_PROVIDER_LABEL,
  PULL_REQUEST_STATUS_BADGE_STYLE,
  PULL_REQUEST_STATUS_MAP,
} from "@/const/pull-request.constant";
import { formatRelativeTime } from "@/lib/helpers/date.helper";
import { PullRequestDetail } from "@/lib/types/pull-request.types";

interface PullRequestDetailHeaderProps {
  detail: PullRequestDetail;
}

const PullRequestDetailHeader = React.memo(
  ({ detail }: PullRequestDetailHeaderProps) => {
    const status = PULL_REQUEST_STATUS_MAP[detail.state];
    const statusStyle = PULL_REQUEST_STATUS_BADGE_STYLE[detail.state];
    const policyStyle = PULL_REQUEST_POLICY_STYLE[detail.effectivePolicy];
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface p-5">
        <div className="flex items-start justify-between gap-4">
          <span className="font-mono text-[17px] font-semibold text-neutral-50">
            {`${PULL_REQUEST_NUMBER_PREFIX[detail.provider]}${detail.externalId} ${detail.title}`}
          </span>
          <Badge palette={statusStyle} size="md">
            {status.label}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-3.5">
          <span className="flex items-center gap-1.5">
            {detail.authorUsername && <Avatar name={detail.authorUsername} />}
            <span className="text-xs text-text-secondary">
              {detail.authorUsername ?? "—"}
            </span>
          </span>

          <span className="flex items-center gap-1.5 text-xs text-text-secondary">
            <Icon
              icon={detail.provider === "GITHUB" ? "FaGithub" : "FaGitlab"}
              size={13}
            />
            {PULL_REQUEST_PROVIDER_LABEL[detail.provider]}
          </span>

          <Badge tone="neutral" shape="tag" size="md" weight="normal">
            {detail.repositoryPath}
          </Badge>

          <Badge tone="neutral" shape="tag" size="md" weight="normal">
            {detail.sourceBranch} → {detail.targetBranch}
          </Badge>

          <Badge palette={policyStyle}>
            {PULL_REQUEST_POLICY_LABEL[detail.effectivePolicy]}
          </Badge>

          <span className="ml-auto text-[11.5px] text-text-muted">
            dibuka {formatRelativeTime(detail.createdAt)}
          </span>
        </div>
      </div>
    );
  },
);

PullRequestDetailHeader.displayName = "PullRequestDetailHeader";

export default PullRequestDetailHeader;
