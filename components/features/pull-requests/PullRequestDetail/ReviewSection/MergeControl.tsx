"use client";

import React, { useCallback, useState } from "react";

import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon/Icon";
import {
  getMergeBlockerReason,
  PULL_REQUEST_NUMBER_PREFIX,
} from "@/const/pull-request.constant";
import { useMergePullRequest } from "@/lib/hooks/pull-requests/useMergePullRequest";
import type { Role } from "@/lib/types/auth.types";
import type {
  MergeBlocker,
  PullRequestDetail,
} from "@/lib/types/pull-request.types";

import MergeDialog from "./MergeDialog";

interface MergeControlProps {
  orgId: string;
  detail: PullRequestDetail;
  role?: Role;
  providerName: string;
}

type DialogMode = "merge" | "override";

const isShownBlocker = (
  blocker: MergeBlocker,
): blocker is Exclude<MergeBlocker, "pull_not_open"> =>
  blocker !== "pull_not_open";

// Merge is its own action — approving never merges.
const MergeControl = React.memo(
  ({ orgId, detail, role, providerName }: MergeControlProps) => {
    const [dialogMode, setDialogMode] = useState<DialogMode | null>(null);
    const { handleMerge, isMerging, mergeError, clearMergeError } =
      useMergePullRequest(orgId, detail.repositoryId, detail.id, {
        providerName,
        targetBranch: detail.targetBranch,
      });

    const closeDialog = useCallback(() => {
      setDialogMode(null);
      clearMergeError();
    }, [clearMergeError]);

    const merge = detail.merge;
    // Older BE (no `merge`) or a PR that is no longer open: nothing to offer.
    if (!merge || merge.blockers.includes("pull_not_open")) return null;

    const criticalCount = detail.latestScan?.criticalCount ?? 0;
    const reasons = merge.blockers
      .filter(isShownBlocker)
      .map((blocker) => getMergeBlockerReason(blocker, criticalCount));
    // Only critical findings stand in the way: an Admin may override them.
    const canOverride =
      role === "ADMIN" &&
      !merge.allowed &&
      merge.blockers.length === 1 &&
      merge.blockers[0] === "critical_findings";

    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="primary"
            size="sm"
            fullWidth={false}
            onClick={() => setDialogMode("merge")}
            disabled={!merge.allowed || !detail.headSha}
            icon={<Icon icon="TbGitMerge" size={13} />}
          >
            Merge
          </Button>
          {canOverride && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              fullWidth={false}
              onClick={() => setDialogMode("override")}
              disabled={!detail.headSha}
            >
              Merge anyway…
            </Button>
          )}
        </div>

        {!merge.allowed && reasons.length > 0 && (
          <ul className="flex flex-col gap-1">
            {reasons.map((reason) => (
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

        {dialogMode && detail.headSha && (
          <MergeDialog
            pullLabel={`${PULL_REQUEST_NUMBER_PREFIX[detail.provider]}${detail.externalId}`}
            targetBranch={detail.targetBranch}
            sourceBranch={detail.sourceBranch}
            providerName={providerName}
            headSha={detail.headSha}
            isOverride={dialogMode === "override"}
            criticalCount={criticalCount}
            isMerging={isMerging}
            error={mergeError}
            onMerge={handleMerge}
            onClose={closeDialog}
          />
        )}
      </div>
    );
  },
);

MergeControl.displayName = "MergeControl";

export default MergeControl;
