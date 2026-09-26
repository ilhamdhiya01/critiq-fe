"use client";

import classNames from "classnames";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useMemo } from "react";

import StateStatus from "@/components/shared/state-status";
import Icon from "@/components/ui/icon/Icon";
import {
  PULL_REQUEST_POLICY_LABEL,
  PULL_REQUEST_POLICY_STYLE,
  PULL_REQUEST_PROVIDER_LABEL,
  PULL_REQUEST_STATUS_BADGE_STYLE,
  PULL_REQUEST_STATUS_MAP,
} from "@/const/pull-request.constant";
import { getAvatarColor, getInitials } from "@/lib/helpers/avatar.helper";
import { formatRelativeTime } from "@/lib/helpers/date.helper";
import { usePullRequestDetail } from "@/lib/hooks/pull-requests/usePullRequestDetail";
import { usePullRequestDetailDiff } from "@/lib/hooks/pull-requests/usePullRequestDetailDiff";
import { ROUTES } from "@/routes";

import PullRequestDetailSkeleton from "./PullRequestDetailSkeleton";
import PullRequestDiff from "./PullRequestDiff";
import PullRequestDiscussion from "./PullRequestDiscussion";

const GITHUB_SECRET =
  "dsfsdfsdfjsjdfjsdfjsdfjsdfjsdfjsdfjsdfjsdfjsdfjsdfjsdfjsdfjsdfjsdfjsdfj";

interface PullRequestDetailProps {
  orgId?: string;
  repoId: string;
  id: string;
}

const PullRequestDetail = React.memo(
  ({ id, repoId, orgId }: PullRequestDetailProps) => {
    const params = useParams<{ slug: string }>();
    const slug = params.slug;

    const { data, isLoading, isError } = usePullRequestDetail(
      orgId ?? "",
      repoId,
      id,
    );

    console.log(data);
    const {
      data: diff,
      isLoading: isLoadingDiff,
      isError: isErrorDiff,
    } = usePullRequestDetailDiff(orgId ?? "", repoId, id);

    const authorInitials = useMemo(
      () => (data?.authorUsername ? getInitials(data.authorUsername) : "?"),
      [data?.authorUsername],
    );
    const authorAvatarColor = useMemo(
      () =>
        data?.authorUsername
          ? getAvatarColor(data.authorUsername)
          : "bg-raised",
      [data?.authorUsername],
    );

    if (isError) {
      return (
        <StateStatus
          title="Gagal memuat detail pull request"
          description="Terjadi kesalahan saat mengambil data. Coba muat ulang halaman."
        />
      );
    }

    if (isLoading || isLoadingDiff || !diff || !data) {
      return <PullRequestDetailSkeleton />;
    }

    const status = PULL_REQUEST_STATUS_MAP[data.state];
    const statusStyle = PULL_REQUEST_STATUS_BADGE_STYLE[data.state];
    const policyStyle = PULL_REQUEST_POLICY_STYLE[data.effectivePolicy];

    return (
      <div className="flex flex-col gap-4">
        <Link
          href={ROUTES.pullRequests(slug)}
          className="flex w-fit items-center gap-1.5 text-xs text-text-faint transition-colors hover:text-text-nav"
        >
          <Icon icon="TbChevronLeft" size={13} />
          Kembali ke Pull Requests
        </Link>

        <div className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface p-5">
          <div className="flex items-start justify-between gap-4">
            <span className="font-mono text-[17px] font-semibold text-neutral-50">
              {`${data.provider === "GITHUB" ? "#" : "!"}${data.externalId} ${data.title}`}
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
              <span
                className={classNames(
                  "flex h-5.5 w-5.5 items-center justify-center rounded-full text-[9px] font-bold text-neutral-50",
                  authorAvatarColor,
                )}
              >
                {authorInitials}
              </span>
              <span className="text-xs text-text-secondary">
                {data.authorUsername ?? "—"}
              </span>
            </span>

            <span className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Icon
                icon={data.provider === "GITHUB" ? "FaGithub" : "FaGitlab"}
                size={13}
              />
              {PULL_REQUEST_PROVIDER_LABEL[data.provider]}
            </span>

            <span className="rounded-md border border-border-default bg-raised px-2 py-1 font-mono text-[11px] text-text-secondary">
              {data.repositoryPath}
            </span>

            <span className="rounded-md border border-border-default bg-raised px-2 py-1 font-mono text-[11px] text-text-secondary">
              {data.sourceBranch} → {data.targetBranch}
            </span>

            <span
              className={classNames(
                "rounded-full border px-2.5 py-1 font-mono text-[10.5px] font-medium",
                policyStyle.text,
                policyStyle.bg,
                policyStyle.border,
              )}
            >
              {PULL_REQUEST_POLICY_LABEL[data.effectivePolicy]}
            </span>

            <span className="ml-auto text-[11.5px] text-text-muted">
              dibuka {formatRelativeTime(data.createdAt)}
            </span>
          </div>
        </div>

        {isErrorDiff ? (
          <StateStatus
            title="Gagal memuat diff"
            description="Terjadi kesalahan saat mengambil perubahan file. Coba muat ulang halaman."
          />
        ) : (
          <PullRequestDiff files={diff.files} truncated={diff.truncated} />
        )}

        <PullRequestDiscussion />
      </div>
    );
  },
);

PullRequestDetail.displayName = "PullRequestDetail";

export default PullRequestDetail;
