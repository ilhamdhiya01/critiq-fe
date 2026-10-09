"use client";

import { useParams } from "next/navigation";
import React, { useCallback, useMemo, useState } from "react";

import BackLink from "@/components/shared/back-link";
import StateStatus from "@/components/shared/state-status";
import { REVIEW_MODE_COPY } from "@/const/pull-request.constant";
import { getErrorCode } from "@/lib/helpers/integration.helper";
import { useOrgBySlug } from "@/lib/hooks/organisation/useOrgBySlug";
import { usePullRequestDetail } from "@/lib/hooks/pull-requests/usePullRequestDetail";
import { usePullRequestDetailDiff } from "@/lib/hooks/pull-requests/usePullRequestDetailDiff";
import { usePullRequestSummary } from "@/lib/hooks/pull-requests/usePullRequestSummary";
import type {
  ParsedPullRequestFile,
  ReviewMode,
} from "@/lib/types/pull-request.types";
import { ROUTES } from "@/routes";

import AiSummaryCard from "./AiSummaryCard";
import AiSummaryCardSkeleton from "./AiSummaryCard/AiSummaryCardSkeleton";
import BranchPolicyBanner from "./BranchPolicyBanner";
import DiffErrorState from "./DiffErrorState";
import FlaggedIssues from "./FlaggedIssues";
import ManualModeNotice from "./ManualModeNotice";
import ManualReviewConfirmation from "./ManualReviewConfirmation";
import PullRequestDetailHeader from "./PullRequestDetailHeader";
import PullRequestDetailSkeleton from "./PullRequestDetailSkeleton";
import PullRequestDiff from "./PullRequestDiff";
import PullRequestDiscussion from "./PullRequestDiscussion";
import ReviewModeToggle from "./ReviewModeToggle";

// Stable empty list so memoised children do not re-render when the diff failed.
const NO_DIFF_FILES: ParsedPullRequestFile[] = [];

interface PullRequestDetailProps {
  orgId?: string;
  repoId: string;
  id: string;
}

const PullRequestDetail = React.memo(
  ({ id, repoId, orgId }: PullRequestDetailProps) => {
    const params = useParams<{ slug: string }>();
    const slug = params.slug;
    const { membership } = useOrgBySlug(slug);

    const { data, isLoading, isError } = usePullRequestDetail(
      orgId ?? "",
      repoId,
      id,
    );

    const {
      data: diff,
      isLoading: isLoadingDiff,
      isError: isErrorDiff,
      error: diffError,
    } = usePullRequestDetailDiff(orgId ?? "", repoId, id);

    const { data: summary, isLoading: isLoadingSummary } =
      usePullRequestSummary(orgId ?? "", repoId, id);

    // Only used when the policy opens both tabs (REQUIRE_BOTH). Not
    // persisted — the BE has no per-PR mode yet.
    const [chosenMode, setChosenMode] = useState<ReviewMode>("ai");
    const handleChangeMode = useCallback(
      (mode: ReviewMode) => setChosenMode(mode),
      [],
    );

    const policy = data?.effectivePolicy;
    // MANUAL_ONLY locks Manual, ALLOW_AI locks AI-Assisted, REQUIRE_BOTH
    // leaves both tabs open.
    const lockedMode: ReviewMode | null =
      policy === "MANUAL_ONLY" ? "manual" : policy === "ALLOW_AI" ? "ai" : null;
    const reviewMode: ReviewMode = lockedMode ?? chosenMode;

    // Manual review shows rule findings only, as in the mockup.
    const findings = useMemo(() => {
      const all = data?.latestScan?.findings ?? [];
      return reviewMode === "manual"
        ? all.filter((finding) => finding.source !== "AI")
        : all;
    }, [data?.latestScan?.findings, reviewMode]);

    // The diff-viewer gutter flags Critical (red) and Major (orange) lines —
    // Minor/Info findings exist in the type but have no gutter marker.
    const flaggableFindingsForDiff = useMemo(
      () =>
        findings.filter(
          (finding) =>
            finding.severity === "CRITICAL" || finding.severity === "MAJOR",
        ),
      [findings],
    );

    const criticalCount = data?.latestScan?.criticalCount ?? 0;

    const suggestionCount = useMemo(
      () =>
        findings.filter(
          (finding) =>
            finding.severity === "MAJOR" || finding.severity === "MINOR",
        ).length,
      [findings],
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

    // A failed diff must not hold the page on the skeleton — the rest of the
    // detail still renders and the diff area explains the error.
    if (isLoading || isLoadingDiff || !data) {
      return <PullRequestDetailSkeleton />;
    }

    const requiresBoth = data.effectivePolicy === "REQUIRE_BOTH";
    const diffFiles = diff?.files ?? NO_DIFF_FILES;

    return (
      <div className="flex flex-col gap-4">
        <BackLink
          href={ROUTES.pullRequests(slug)}
          label="Kembali ke Pull Requests"
        />

        <PullRequestDetailHeader detail={data} />

        <ReviewModeToggle
          mode={reviewMode}
          lockedMode={lockedMode}
          targetBranch={data.targetBranch}
          onChange={handleChangeMode}
        />

        {requiresBoth && (
          <BranchPolicyBanner targetBranch={data.targetBranch} />
        )}

        {reviewMode === "manual" ? (
          <ManualModeNotice
            message={
              data.effectivePolicy === "MANUAL_ONLY"
                ? REVIEW_MODE_COPY.policyManualNotice
                : REVIEW_MODE_COPY.chosenManualNotice
            }
          />
        ) : isLoadingSummary ? (
          <AiSummaryCardSkeleton />
        ) : (
          <AiSummaryCard
            orgId={orgId ?? ""}
            repoId={repoId}
            id={id}
            summary={summary}
            criticalCount={criticalCount}
            suggestionCount={suggestionCount}
            filesChanged={data.latestScan?.filesChanged ?? diffFiles.length}
            additions={additions}
            deletions={deletions}
            settingsHref={ROUTES.settings(slug)}
            role={membership?.role}
          />
        )}

        {requiresBoth && <ManualReviewConfirmation />}

        <FlaggedIssues
          findings={findings}
          files={diffFiles}
          truncated={data.latestScan?.findingsTruncated ?? false}
        />

        {isErrorDiff || !diff ? (
          <DiffErrorState errorCode={getErrorCode(diffError)} />
        ) : (
          <PullRequestDiff
            files={diff.files}
            truncated={diff.truncated}
            findings={flaggableFindingsForDiff}
          />
        )}

        <PullRequestDiscussion />
      </div>
    );
  },
);

PullRequestDetail.displayName = "PullRequestDetail";

export default PullRequestDetail;
