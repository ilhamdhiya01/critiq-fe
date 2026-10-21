"use client";

import { useParams } from "next/navigation";
import React, { useCallback, useMemo, useRef, useState } from "react";

import BackLink from "@/components/shared/back-link";
import ScrollToTop from "@/components/shared/scroll-to-top";
import StateStatus from "@/components/shared/state-status";
import { PR_STICKY_BAR_HEIGHT_PX } from "@/const/layout.constant";
import {
  PR_REVIEW_SECTION_ID,
  REVIEW_MODE_COPY,
  SCROLL_TO_TOP_MIN_DIFF_FILES,
} from "@/const/pull-request.constant";
import { PROVIDER_NAME } from "@/const/repository.constant";
import { getErrorCode } from "@/lib/helpers/integration.helper";
import {
  useActiveMembership,
  useActiveOrgId,
} from "@/lib/hooks/organisation/useActiveOrg";
import { usePullRequestDetail } from "@/lib/hooks/pull-requests/usePullRequestDetail";
import { usePullRequestDetailDiff } from "@/lib/hooks/pull-requests/usePullRequestDetailDiff";
import { usePullRequestSummary } from "@/lib/hooks/pull-requests/usePullRequestSummary";
import type {
  CommentScope,
  Finding,
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
import OutdatedComments from "./OutdatedComments";
import PullRequestDetailHeader from "./PullRequestDetailHeader";
import PullRequestDetailSkeleton from "./PullRequestDetailSkeleton";
import PullRequestDiff from "./PullRequestDiff";
import PullRequestDiscussion from "./PullRequestDiscussion";
import PullRequestStickyBar from "./PullRequestStickyBar";
import ReviewHistory from "./ReviewHistory";
import ReviewModeToggle from "./ReviewModeToggle";
import ReviewSection from "./ReviewSection";
import UncheckedTiersNotice from "./UncheckedTiersNotice";

// Stable empty list so memoised children do not re-render when the diff failed.
const NO_DIFF_FILES: ParsedPullRequestFile[] = [];
const NO_FINDINGS: Finding[] = [];

interface PullRequestDetailProps {
  repoId: string;
  id: string;
}

const PullRequestDetail = React.memo(
  ({ id, repoId }: PullRequestDetailProps) => {
    const orgId = useActiveOrgId();
    const params = useParams<{ slug: string }>();
    const slug = params.slug;
    const membership = useActiveMembership();

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

    // The compact sticky bar shows once this has scrolled out of view.
    const headerRef = useRef<HTMLDivElement>(null);

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

    // One list for both tabs: the review mode only hides the AI summary,
    // never the flagged issues (static and AI alike).
    const findings = data?.latestScan?.findings ?? NO_FINDINGS;

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

    const role = membership?.role;
    const provider = data?.provider;
    const headSha = data?.headSha ?? null;
    // One stable object for every comment component (memoised children).
    const commentScope = useMemo<CommentScope>(
      () => ({
        orgId: orgId ?? "",
        repoId,
        pullId: id,
        headSha,
        providerName: provider ? PROVIDER_NAME[provider] : "",
        canComment: role === "ADMIN" || role === "REVIEWER",
      }),
      [orgId, repoId, id, headSha, provider, role],
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
      <div
        className="flex flex-col gap-4"
        // Shared by the sticky bar and the diff's pinned file headers.
        style={
          {
            "--pr-bar-h": `${PR_STICKY_BAR_HEIGHT_PX}px`,
          } as React.CSSProperties
        }
      >
        <PullRequestStickyBar
          targetRef={headerRef}
          detail={data}
          additions={additions}
          deletions={deletions}
          role={membership?.role}
        />

        <BackLink
          href={ROUTES.pullRequests(slug)}
          label="Kembali ke Pull Requests"
        />

        <div ref={headerRef}>
          <PullRequestDetailHeader
            detail={data}
            orgId={orgId ?? ""}
            role={membership?.role}
          />
        </div>

        <UncheckedTiersNotice
          tiers={data.latestScan?.uncheckedTiers}
          aiStatus={data.latestScan?.aiStatus}
          rulesHref={ROUTES.rules(slug)}
          settingsHref={ROUTES.settings(slug)}
        />

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
            prState={data.state}
            hasScan={!!data.latestScan}
          />
        )}

        <FlaggedIssues
          findings={findings}
          files={diffFiles}
          truncated={data.latestScan?.findingsTruncated ?? false}
          scan={data.latestScan}
        />

        {isErrorDiff || !diff ? (
          <DiffErrorState errorCode={getErrorCode(diffError)} />
        ) : (
          <PullRequestDiff
            files={diff.files}
            truncated={diff.truncated}
            findings={flaggableFindingsForDiff}
            scope={commentScope}
          />
        )}

        <OutdatedComments scope={commentScope} />

        {/* Clears the sticky bar when its "Review" button jumps here. */}
        <div
          id={PR_REVIEW_SECTION_ID}
          className="flex scroll-mt-20 flex-col gap-4 empty:hidden"
        >
          <ReviewSection
            key={data.headSha ?? "no-head"}
            orgId={orgId ?? ""}
            detail={data}
            summaryAiStatus={summary?.aiStatus}
            role={membership?.role}
          />
        </div>

        <ReviewHistory orgId={orgId ?? ""} repoId={repoId} pullId={id} />

        <PullRequestDiscussion scope={commentScope} />

        {diffFiles.length >= SCROLL_TO_TOP_MIN_DIFF_FILES && <ScrollToTop />}
      </div>
    );
  },
);

PullRequestDetail.displayName = "PullRequestDetail";

export default PullRequestDetail;
