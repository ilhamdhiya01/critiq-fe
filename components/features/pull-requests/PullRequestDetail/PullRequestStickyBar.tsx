"use client";

import classNames from "classnames";
import React, { type RefObject } from "react";

import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import {
  PR_REVIEW_SECTION_ID,
  PULL_REQUEST_MERGE_VERB,
  PULL_REQUEST_NUMBER_PREFIX,
  PULL_REQUEST_STATUS_BADGE_STYLE,
  PULL_REQUEST_STATUS_MAP,
} from "@/const/pull-request.constant";
import { useIsScrolledPast } from "@/lib/hooks/useIsScrolledPast";
import type { Role } from "@/lib/types/auth.types";
import type { PullRequestDetail } from "@/lib/types/pull-request.types";

interface PullRequestStickyBarProps {
  // The full header; the bar shows once it scrolls out of view.
  targetRef: RefObject<HTMLElement | null>;
  detail: PullRequestDetail;
  additions: number;
  deletions: number;
  role?: Role;
}

const BRANCH_CLASS = "max-w-[40%] min-w-0 truncate";

// Compact PR header pinned to the top while scrolling, like GitHub's.
// Sticky stops at <main>'s padding edge, so -top-6 (= DashboardLayout's p-6)
// pulls it flush under the navbar. The diff's file headers stick right below
// it: top-9 = this bar's h-15 (60px) minus that 24px.
const PullRequestStickyBar = React.memo(
  ({
    targetRef,
    detail,
    additions,
    deletions,
    role,
  }: PullRequestStickyBarProps) => {
    const isVisible = useIsScrolledPast(targetRef);
    // Same rule as ReviewSection, which renders nothing otherwise.
    const canReview =
      (role === "ADMIN" || role === "REVIEWER") && detail.state === "OPEN";

    const handleJumpToReview = () => {
      const prefersReducedMotion = window.matchMedia?.(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      document.getElementById(PR_REVIEW_SECTION_ID)?.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    };

    return (
      // Zero-height sticky anchor: takes no space (-mb-4 cancels the gap).
      <div className="sticky -top-6 z-30 -mb-4 h-0">
        <div
          data-testid="pr-sticky-bar"
          inert={!isVisible}
          aria-hidden={!isVisible}
          className={classNames(
            "absolute -inset-x-6 top-0 flex h-15 items-center gap-3 border-b border-border-subtle bg-background px-6 transition duration-150 motion-reduce:transition-none",
            {
              "pointer-events-none -translate-y-1 opacity-0": !isVisible,
              "translate-y-0 opacity-100": isVisible,
            },
          )}
        >
          <Badge palette={PULL_REQUEST_STATUS_BADGE_STYLE[detail.state]}>
            {PULL_REQUEST_STATUS_MAP[detail.state].label}
          </Badge>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate font-mono text-[13px] font-semibold text-neutral-50">
              {detail.title}{" "}
              <span className="font-normal text-text-muted">
                {PULL_REQUEST_NUMBER_PREFIX[detail.provider]}
                {detail.externalId}
              </span>
            </span>
            <span className="flex min-w-0 items-center gap-1.5 text-[11.5px] whitespace-nowrap text-text-secondary">
              <span className="min-w-0 truncate font-semibold text-text-nav">
                {detail.authorUsername ?? "—"}
              </span>{" "}
              <span className="shrink-0">
                {PULL_REQUEST_MERGE_VERB[detail.state]}
              </span>{" "}
              <Badge
                tone="neutral"
                shape="tag"
                size="xs"
                weight="normal"
                title={detail.targetBranch}
                className={BRANCH_CLASS}
              >
                {detail.targetBranch}
              </Badge>{" "}
              <span className="shrink-0">from</span>{" "}
              <Badge
                tone="neutral"
                shape="tag"
                size="xs"
                weight="normal"
                title={detail.sourceBranch}
                className={BRANCH_CLASS}
              >
                {detail.sourceBranch}
              </Badge>
            </span>
          </div>
          <span className="hidden shrink-0 font-mono text-[11.5px] sm:inline">
            <span className="text-success-light">+{additions}</span>{" "}
            <span className="text-danger-light">−{deletions}</span>
          </span>
          {canReview && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              fullWidth={false}
              onClick={handleJumpToReview}
            >
              Review
            </Button>
          )}
        </div>
      </div>
    );
  },
);

PullRequestStickyBar.displayName = "PullRequestStickyBar";

export default PullRequestStickyBar;
