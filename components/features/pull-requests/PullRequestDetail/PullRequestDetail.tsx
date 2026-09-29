"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useMemo } from "react";

import StateStatus from "@/components/shared/state-status";
import Icon from "@/components/ui/icon/Icon";
import { usePullRequestDetail } from "@/lib/hooks/pull-requests/usePullRequestDetail";
import { usePullRequestDetailDiff } from "@/lib/hooks/pull-requests/usePullRequestDetailDiff";
import { ROUTES } from "@/routes";

import AiSummaryCard from "./AiSummaryCard";
import BranchPolicyBanner from "./BranchPolicyBanner";
import FlaggedIssues from "./FlaggedIssues";
import ManualReviewConfirmation from "./ManualReviewConfirmation";
import PullRequestDetailHeader from "./PullRequestDetailHeader";
import PullRequestDetailSkeleton from "./PullRequestDetailSkeleton";
import PullRequestDiff from "./PullRequestDiff";
import PullRequestDiscussion from "./PullRequestDiscussion";

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

    const {
      data: diff,
      isLoading: isLoadingDiff,
      isError: isErrorDiff,
    } = usePullRequestDetailDiff(orgId ?? "", repoId, id);

    // MVP scope for the diff-viewer gutter is Critical-only (see the PRD):
    // other severities exist in the type but are not surfaced there. The
    // Flagged Issues card itself now groups all severities internally.
    const criticalFindingsForDiff = useMemo(
      () =>
        (data?.latestScan?.findings ?? []).filter(
          (finding) => finding.severity === "CRITICAL",
        ),
      [data?.latestScan?.findings],
    );

    const criticalCount = data?.latestScan?.criticalCount ?? 0;

    const suggestionCount = useMemo(
      () =>
        (data?.latestScan?.findings ?? []).filter(
          (finding) =>
            finding.severity === "MAJOR" || finding.severity === "MINOR",
        ).length,
      [data?.latestScan?.findings],
    );

    const { additions, deletions } = useMemo(
      () =>
        (diff?.files ?? []).reduce(
          (acc, file) => ({
            additions: acc.additions + file.addedCount,
            deletions: acc.deletions + file.removedCount,
          }),
          { additions: 0, deletions: 0 },
        ),
      [diff?.files],
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

    const requiresBoth = data.effectivePolicy === "REQUIRE_BOTH";

    return (
      <div className="flex flex-col gap-4">
        <Link
          href={ROUTES.pullRequests(slug)}
          className="flex w-fit items-center gap-1.5 text-xs text-text-faint transition-colors hover:text-text-nav"
        >
          <Icon icon="TbChevronLeft" size={13} />
          Kembali ke Pull Requests
        </Link>

        <PullRequestDetailHeader detail={data} />

        {requiresBoth && (
          <BranchPolicyBanner targetBranch={data.targetBranch} />
        )}

        <AiSummaryCard
          criticalCount={criticalCount}
          suggestionCount={suggestionCount}
          filesChanged={data.latestScan?.filesChanged ?? diff.files.length}
          additions={additions}
          deletions={deletions}
        />

        {requiresBoth && <ManualReviewConfirmation />}

        <FlaggedIssues
          findings={data.latestScan?.findings ?? []}
          files={diff.files}
          truncated={data.latestScan?.findingsTruncated ?? false}
        />

        {isErrorDiff ? (
          <StateStatus
            title="Gagal memuat diff"
            description="Terjadi kesalahan saat mengambil perubahan file. Coba muat ulang halaman."
          />
        ) : (
          <PullRequestDiff
            files={diff.files}
            truncated={diff.truncated}
            findings={criticalFindingsForDiff}
          />
        )}

        <PullRequestDiscussion />
      </div>
    );
  },
);

PullRequestDetail.displayName = "PullRequestDetail";

export default PullRequestDetail;
