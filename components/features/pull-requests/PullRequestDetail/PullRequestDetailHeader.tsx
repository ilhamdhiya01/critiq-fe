import classNames from "classnames";
import Image from "next/image";
import React from "react";

import Icon from "@/components/ui/icon/Icon";
import {
  PULL_REQUEST_POLICY_LABEL,
  PULL_REQUEST_POLICY_STYLE,
  PULL_REQUEST_PROVIDER_LABEL,
  PULL_REQUEST_STATUS_BADGE_STYLE,
  PULL_REQUEST_STATUS_MAP,
} from "@/const/pull-request.constant";
import { formatRelativeTime } from "@/lib/helpers/date.helper";
import { useUser } from "@/lib/hooks/auth/useUser";
import { PullRequestDetail } from "@/lib/types/pull-request.types";

interface PullRequestDetailHeaderProps {
  detail: PullRequestDetail;
}

const PullRequestDetailHeader = React.memo(
  ({ detail }: PullRequestDetailHeaderProps) => {
    const { data: user } = useUser();

    const status = PULL_REQUEST_STATUS_MAP[detail.state];
    const statusStyle = PULL_REQUEST_STATUS_BADGE_STYLE[detail.state];
    const policyStyle = PULL_REQUEST_POLICY_STYLE[detail.effectivePolicy];
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface p-5">
        <div className="flex items-start justify-between gap-4">
          <span className="font-mono text-[17px] font-semibold text-neutral-50">
            {`${detail.provider === "GITHUB" ? "#" : "!"}${detail.externalId} ${detail.title}`}
          </span>
          <span
            className={classNames(
              "shrink-0 rounded-full border px-2.5 py-1 font-mono text-[11px] font-semibold",
              statusStyle.text,
              statusStyle.bg,
              statusStyle.border,
            )}
          >
            {status.label}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3.5">
          <span className="flex items-center gap-1.5">
            {user && user.avatarUrl && (
              <Image
                alt="avatar"
                src={user.avatarUrl}
                width={22}
                height={22}
                className="rounded-full"
              />
            )}
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

          <span className="rounded-md border border-border-default bg-raised px-2 py-1 font-mono text-[11px] text-text-secondary">
            {detail.repositoryPath}
          </span>

          <span className="rounded-md border border-border-default bg-raised px-2 py-1 font-mono text-[11px] text-text-secondary">
            {detail.sourceBranch} → {detail.targetBranch}
          </span>

          <span
            className={classNames(
              "rounded-full border px-2.5 py-1 font-mono text-[10.5px] font-medium",
              policyStyle.text,
              policyStyle.bg,
              policyStyle.border,
            )}
          >
            {PULL_REQUEST_POLICY_LABEL[detail.effectivePolicy]}
          </span>

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
