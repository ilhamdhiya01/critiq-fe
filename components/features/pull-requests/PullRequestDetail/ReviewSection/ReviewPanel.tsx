"use client";

import classNames from "classnames";
import React, { useState } from "react";

import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon/Icon";
import Notice from "@/components/ui/notice";
import Textarea from "@/components/ui/textarea";
import {
  MY_REVIEW_STATUS,
  REVIEW_APPROVE_BLOCKED_REASON,
  REVIEW_BODY_MAX,
} from "@/const/pull-request.constant";
import { formatRelativeTime } from "@/lib/helpers/date.helper";
import { getErrorCode } from "@/lib/helpers/integration.helper";
import { useSubmitReview } from "@/lib/hooks/pull-requests/useSubmitReview";
import type {
  PullRequestReview,
  ReviewDecision,
} from "@/lib/types/pull-request.types";

interface ReviewPanelProps {
  orgId: string;
  repoId: string;
  pullId: string;
  // The commit the reviewer is looking at; null until the BE knows it.
  headSha: string | null;
  requiresBoth: boolean;
  isConfirmed: boolean;
  isAiDone: boolean;
  // My latest decision on this commit; the same one can't be sent again.
  myReview: PullRequestReview | null;
  // Rendered below the review actions (the separate Merge control).
  children?: React.ReactNode;
}

const FORM_COPY: Record<
  ReviewDecision,
  { label: string; placeholder: string; submit: string }
> = {
  approve: {
    label: "Comment (optional)",
    placeholder: "Anything the author should know?",
    submit: "Submit approval",
  },
  request_changes: {
    label: "What needs to change?",
    placeholder: "Describe what must be fixed before this can be approved.",
    submit: "Request changes",
  },
};

const ReviewPanel = React.memo(
  ({
    orgId,
    repoId,
    pullId,
    headSha,
    requiresBoth,
    isConfirmed,
    isAiDone,
    myReview,
    children,
  }: ReviewPanelProps) => {
    const [decision, setDecision] = useState<ReviewDecision | null>(null);
    const [body, setBody] = useState("");
    const { handleSubmitReview, isSubmitting, submitError, clearSubmitError } =
      useSubmitReview(orgId, repoId, pullId);

    // Require both: approval needs the manual confirmation and a finished
    // AI analysis for this commit. Listed so the reviewer knows why.
    const hasApproved = myReview?.decision === "approve";
    const hasRequestedChanges = myReview?.decision === "request_changes";

    // Once I approved this commit the Approve button is gone, so its
    // blockers would only confuse.
    const approveBlockers: string[] = [];
    if (requiresBoth && !hasApproved && !isConfirmed) {
      approveBlockers.push(REVIEW_APPROVE_BLOCKED_REASON.confirmation);
    }
    if (requiresBoth && !hasApproved && !isAiDone) {
      approveBlockers.push(REVIEW_APPROVE_BLOCKED_REASON.aiAnalysis);
    }
    const canApprove = approveBlockers.length === 0;

    const trimmed = body.trim();
    const isTooLong = body.length > REVIEW_BODY_MAX;
    const isBodyMissing = decision === "request_changes" && trimmed === "";
    const canSubmit =
      !!decision &&
      !!headSha &&
      !isTooLong &&
      !isBodyMissing &&
      (decision !== "approve" || canApprove);

    const openForm = (next: ReviewDecision) => {
      setDecision(next);
      clearSubmitError();
    };

    const resetForm = () => {
      setDecision(null);
      setBody("");
    };

    const closeForm = () => {
      resetForm();
      clearSubmitError();
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!decision || !headSha || !canSubmit) return;
      try {
        await handleSubmitReview({
          decision,
          headSha,
          ...(trimmed ? { body: trimmed } : {}),
          ...(decision === "approve" && requiresBoth
            ? { manualConfirmation: true }
            : {}),
        });
        closeForm();
      } catch (error) {
        // Already recorded (e.g. another tab): nothing left to send, so
        // close the form and keep the message. Other errors keep the text.
        if (getErrorCode(error) === "already_reviewed") resetForm();
      }
    };

    return (
      <section className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <h3 className="font-mono text-[13px] font-semibold text-text-strong">
            Your review
          </h3>
          <span className="text-[11.5px] text-text-faint">
            Recorded in Critiq and sent to the code host. AI never approves on
            its own.
          </span>
        </div>

        {!decision && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2.5">
              {hasApproved && myReview ? (
                <span
                  role="status"
                  className="flex items-center gap-1.5 rounded-md border border-success/40 bg-success/10 px-3 py-1.5 text-xs text-success-light"
                >
                  <Icon icon="TbCheck" size={13} />
                  {MY_REVIEW_STATUS.approve}
                  <span className="text-text-muted">
                    · {formatRelativeTime(myReview.createdAt)}
                  </span>
                </span>
              ) : (
                <Button
                  type="button"
                  variant="success"
                  size="sm"
                  fullWidth={false}
                  onClick={() => openForm("approve")}
                  disabled={!canApprove || !headSha}
                  icon={<Icon icon="TbCheck" size={13} />}
                >
                  Approve
                </Button>
              )}
              <Button
                type="button"
                variant="danger"
                size="sm"
                fullWidth={false}
                onClick={() => openForm("request_changes")}
                disabled={!headSha || hasRequestedChanges}
                icon={<Icon icon="TbMessageReport" size={13} />}
              >
                Request changes
              </Button>
            </div>
            {hasRequestedChanges && myReview && (
              <span
                role="status"
                className="flex items-center gap-1.5 text-[11.5px] text-danger-light"
              >
                <Icon icon="TbMessageReport" size={12} />
                {MY_REVIEW_STATUS.request_changes}
                <span className="text-text-muted">
                  · {formatRelativeTime(myReview.createdAt)}
                </span>
              </span>
            )}
            {approveBlockers.length > 0 && (
              <ul className="flex flex-col gap-1">
                {approveBlockers.map((reason) => (
                  <li
                    key={reason}
                    className="flex items-center gap-1.5 text-[11.5px] text-warning-light"
                  >
                    <Icon icon="TbLock" size={12} className="flex-none" />
                    {reason}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {decision && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11.5px] text-text-secondary">
                {FORM_COPY[decision].label}
              </span>
              <Textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={FORM_COPY[decision].placeholder}
                rows={4}
                error={isTooLong ? "too long" : undefined}
                aria-required={decision === "request_changes"}
                autoFocus
              />
            </label>
            <span
              className={classNames("self-end font-mono text-[10.5px]", {
                "text-danger-light": isTooLong,
                "text-text-muted": !isTooLong,
              })}
            >
              {body.length}/{REVIEW_BODY_MAX}
            </span>

            <div className="flex justify-end gap-2.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                fullWidth={false}
                onClick={closeForm}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={decision === "approve" ? "success" : "danger"}
                size="sm"
                fullWidth={false}
                disabled={!canSubmit || isSubmitting}
                isLoading={isSubmitting}
              >
                {FORM_COPY[decision].submit}
              </Button>
            </div>
          </form>
        )}

        {submitError && <Notice tone="danger">{submitError}</Notice>}

        {children && (
          <div className="border-t border-border-row pt-3">{children}</div>
        )}
      </section>
    );
  },
);

ReviewPanel.displayName = "ReviewPanel";

export default ReviewPanel;
