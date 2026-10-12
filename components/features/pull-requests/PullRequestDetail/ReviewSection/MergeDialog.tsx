"use client";

import classNames from "classnames";
import React, { useState } from "react";

import Button from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
import Modal from "@/components/ui/modal";
import Notice from "@/components/ui/notice";
import SegmentedControl from "@/components/ui/segmented-control";
import Textarea from "@/components/ui/textarea";
import {
  MERGE_METHOD_OPTIONS,
  MERGE_OVERRIDE_REASON_MAX,
} from "@/const/pull-request.constant";
import type {
  MergeMethod,
  MergePullRequestInput,
} from "@/lib/types/pull-request.types";

interface MergeDialogProps {
  // e.g. "#123" / "!45"
  pullLabel: string;
  targetBranch: string;
  sourceBranch: string;
  providerName: string;
  headSha: string;
  // Admin merging despite open critical findings — a reason is required.
  isOverride: boolean;
  criticalCount: number;
  isMerging: boolean;
  error: string | null;
  onMerge: (input: MergePullRequestInput) => Promise<unknown>;
  onClose: () => void;
}

const MergeDialog = React.memo(
  ({
    pullLabel,
    targetBranch,
    sourceBranch,
    providerName,
    headSha,
    isOverride,
    criticalCount,
    isMerging,
    error,
    onMerge,
    onClose,
  }: MergeDialogProps) => {
    const [method, setMethod] = useState<MergeMethod>("merge");
    const [deleteSourceBranch, setDeleteSourceBranch] = useState(false);
    const [reason, setReason] = useState("");

    const trimmedReason = reason.trim();
    const isReasonTooLong = reason.length > MERGE_OVERRIDE_REASON_MAX;
    const canMerge =
      !isMerging && (!isOverride || (trimmedReason !== "" && !isReasonTooLong));

    const handleMerge = async () => {
      if (!canMerge) return;
      try {
        await onMerge({
          headSha,
          method,
          deleteSourceBranch,
          ...(isOverride
            ? { overrideCritical: { reason: trimmedReason } }
            : {}),
        });
        onClose();
      } catch {
        // `error` explains it inside the dialog.
      }
    };

    return (
      <Modal
        isOpen
        title={isOverride ? "Merge anyway" : "Merge pull request"}
        onClose={onClose}
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              fullWidth={false}
              onClick={onClose}
              disabled={isMerging}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={isOverride ? "danger" : "primary"}
              size="sm"
              fullWidth={false}
              onClick={handleMerge}
              disabled={!canMerge}
              isLoading={isMerging}
            >
              {isOverride ? "Merge anyway" : "Merge"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-[12.5px] leading-normal text-text-nav">
            Merge{" "}
            <span className="font-mono text-text-strong">{pullLabel}</span> into{" "}
            <span className="font-mono text-text-strong">{targetBranch}</span>{" "}
            on {providerName} as Critiq
          </p>

          {isOverride && (
            <Notice tone="danger">
              {criticalCount === 1
                ? "1 critical finding is still open."
                : `${criticalCount} critical findings are still open.`}{" "}
              The reason is recorded in the audit log.
            </Notice>
          )}

          <div className="flex flex-col gap-1.5">
            <span className="text-[11.5px] text-text-secondary">
              Merge method
            </span>
            <SegmentedControl
              size="sm"
              options={MERGE_METHOD_OPTIONS}
              value={method}
              onChange={setMethod}
              ariaLabel="Merge method"
              className="self-start"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 text-[12.5px] text-text-nav">
            <Checkbox
              checked={deleteSourceBranch}
              onChange={(event) => setDeleteSourceBranch(event.target.checked)}
            />
            Delete source branch
            <span className="font-mono text-[11.5px] text-text-muted">
              {sourceBranch}
            </span>
          </label>

          {isOverride && (
            <label className="flex flex-col gap-1.5">
              <span className="text-[11.5px] text-text-secondary">
                Why merge with open critical findings?
              </span>
              <Textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="e.g. False positive — the key is a test fixture."
                rows={3}
                error={isReasonTooLong ? "too long" : undefined}
                aria-required
              />
              <span
                className={classNames("self-end font-mono text-[10.5px]", {
                  "text-danger-light": isReasonTooLong,
                  "text-text-muted": !isReasonTooLong,
                })}
              >
                {reason.length}/{MERGE_OVERRIDE_REASON_MAX}
              </span>
            </label>
          )}

          {error && <Notice tone="danger">{error}</Notice>}
        </div>
      </Modal>
    );
  },
);

MergeDialog.displayName = "MergeDialog";

export default MergeDialog;
