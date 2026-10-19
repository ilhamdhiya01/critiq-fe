import classNames from "classnames";
import React from "react";

import Badge from "@/components/ui/badge";
import {
  REVIEW_DECISION_LABEL,
  REVIEW_OUTDATED_LABEL,
} from "@/const/pull-request.constant";
import type { ReviewDecision } from "@/lib/types/pull-request.types";

interface ReviewDecisionBadgeProps {
  decision: ReviewDecision;
  // Dimmed once the PR has commits newer than the review.
  outdated?: boolean;
  className?: string;
}

const ReviewDecisionBadge = React.memo(
  ({ decision, outdated = false, className }: ReviewDecisionBadgeProps) => (
    <Badge
      tone={decision === "approve" ? "green" : "orange"}
      title={outdated ? REVIEW_OUTDATED_LABEL : undefined}
      className={classNames({ "opacity-50": outdated }, className)}
    >
      {REVIEW_DECISION_LABEL[decision]}
    </Badge>
  ),
);

ReviewDecisionBadge.displayName = "ReviewDecisionBadge";

export default ReviewDecisionBadge;
