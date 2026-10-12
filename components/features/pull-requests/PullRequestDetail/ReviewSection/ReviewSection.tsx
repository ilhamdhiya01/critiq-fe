"use client";

import React, { useCallback, useMemo, useState } from "react";

import { PROVIDER_NAME } from "@/const/repository.constant";
import { getMyReviewForHead } from "@/lib/helpers/pull-request.helper";
import { useUser } from "@/lib/hooks/auth/useUser";
import { usePullRequestReviews } from "@/lib/hooks/pull-requests/usePullRequestReviews";
import type { Role } from "@/lib/types/auth.types";
import type {
  AiSummaryStatus,
  PullRequestDetail,
} from "@/lib/types/pull-request.types";

import ManualReviewConfirmation from "../ManualReviewConfirmation";
import MergeControl from "./MergeControl";
import ReviewPanel from "./ReviewPanel";

const AI_DONE: (AiSummaryStatus | null | undefined)[] = ["done", "cached"];

interface ReviewSectionProps {
  orgId: string;
  detail: PullRequestDetail;
  // Fresher than latestScan.aiStatus after a regenerate.
  summaryAiStatus: AiSummaryStatus | null | undefined;
  role?: Role;
}

// Mounted with key={headSha}: a new commit resets the manual confirmation.
const ReviewSection = React.memo(
  ({ orgId, detail, summaryAiStatus, role }: ReviewSectionProps) => {
    const [isConfirmed, setIsConfirmed] = useState(false);
    const handleToggle = useCallback(
      () => setIsConfirmed((current) => !current),
      [],
    );

    const { data: me } = useUser();
    // Same query key as ReviewHistory, so this shares its cache.
    const { data: reviews } = usePullRequestReviews(
      orgId,
      detail.repositoryId,
      detail.id,
    );

    // Memoised: ReviewPanel is React.memo and takes this as children.
    const mergeControl = useMemo(
      () =>
        detail.merge ? (
          <MergeControl
            orgId={orgId}
            detail={detail}
            role={role}
            providerName={PROVIDER_NAME[detail.provider]}
          />
        ) : null,
      [orgId, detail, role],
    );

    const canReview = role === "ADMIN" || role === "REVIEWER";
    // Viewers and merged/closed PRs have nothing to decide here.
    if (!canReview || detail.state !== "OPEN") return null;

    const requiresBoth = detail.effectivePolicy === "REQUIRE_BOTH";
    const myReview = getMyReviewForHead(reviews, me?.id, detail.headSha);
    // My approval of this commit already carries the confirmation to the
    // BE (and merge relies on it), so it can't be taken back by unchecking.
    const isConfirmationRecorded =
      myReview?.decision === "approve" && myReview.manualConfirmation;
    const scan = detail.latestScan;
    const isAiDone =
      !!scan &&
      scan.headSha === detail.headSha &&
      AI_DONE.includes(summaryAiStatus ?? scan.aiStatus);

    return (
      <>
        {requiresBoth && (
          <ManualReviewConfirmation
            checked={isConfirmed || isConfirmationRecorded}
            isLocked={isConfirmationRecorded}
            onToggle={handleToggle}
          />
        )}
        <ReviewPanel
          orgId={orgId}
          repoId={detail.repositoryId}
          pullId={detail.id}
          headSha={detail.headSha}
          requiresBoth={requiresBoth}
          isConfirmed={isConfirmed || isConfirmationRecorded}
          isAiDone={isAiDone}
          myReview={myReview}
        >
          {mergeControl}
        </ReviewPanel>
      </>
    );
  },
);

ReviewSection.displayName = "ReviewSection";

export default ReviewSection;
