"use client";

import React, { useCallback, useMemo } from "react";

import Markdown from "@/components/shared/markdown";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon/Icon";
import Skeleton from "@/components/ui/skeleton";
import Spinner from "@/components/ui/spinner";
import {
  AI_SUMMARY_NO_SCAN_CODE,
  AI_SUMMARY_RISK_LABEL,
  AI_SUMMARY_RISK_STYLE,
  AI_SUMMARY_STALE_STATE,
} from "@/const/pull-request.constant";
import { formatRelativeTime } from "@/lib/helpers/date.helper";
import { getAiBlockedView } from "@/lib/helpers/pull-request.helper";
import { useRegeneratePullRequestSummary } from "@/lib/hooks/pull-requests/useRescanPullRequest";
import { useScanPullRequest } from "@/lib/hooks/pull-requests/useScanPullRequest";
import type { Role } from "@/lib/types/auth.types";
import type {
  PullRequestState,
  PullRequestSummary,
} from "@/lib/types/pull-request.types";

import AiBlockedNotice from "./AiBlockedNotice";

// Backend has sent `error` both as a plain string and as a structured
// { code, hint } object — normalise to a renderable string either way so a
// shape change never crashes the card with "Objects are not valid as a
// React child".
const getErrorMessage = (
  error: PullRequestSummary["error"] | undefined,
): string | null => {
  if (!error) return null;
  if (typeof error === "string") return error;
  return error.hint || error.code || "Analisis AI gagal dijalankan.";
};

interface AiSummaryCardProps {
  orgId: string;
  repoId: string;
  id: string;
  summary: PullRequestSummary | undefined;
  criticalCount: number;
  suggestionCount: number;
  filesChanged: number;
  additions: number;
  deletions: number;
  settingsHref: string;
  // Current user's role in the org; undefined while it loads.
  role?: Role;
  prState: PullRequestState;
  // Finding counts come from the scan; without one there is nothing to count.
  hasScan: boolean;
}

const AiSummaryCard = React.memo(
  ({
    orgId,
    repoId,
    id,
    summary,
    criticalCount,
    suggestionCount,
    filesChanged,
    additions,
    deletions,
    settingsHref,
    role,
    prState,
    hasScan,
  }: AiSummaryCardProps) => {
    const status = summary?.aiStatus;
    const isInProgress = status === "queued" || status === "running";
    const isDone = status === "done" || status === "cached";
    const blockedView = useMemo(
      () => getAiBlockedView(summary, role, prState),
      [summary, role, prState],
    );
    const isNoScan = blockedView?.code === AI_SUMMARY_NO_SCAN_CODE;
    const isStale = blockedView?.isStale ?? false;
    const riskStyle = summary?.riskLevel
      ? AI_SUMMARY_RISK_STYLE[summary.riskLevel]
      : null;

    const { handleRegenerate, isRegenerating } =
      useRegeneratePullRequestSummary(orgId, repoId, id);
    const isRegenerateDisabled = isRegenerating || isInProgress;

    const onRegenerateClick = useCallback(async () => {
      try {
        await handleRegenerate();
      } catch {
        // Handled in useRegeneratePullRequestSummary (toast / refetch).
      }
    }, [handleRegenerate]);

    const { handleScanNow, isStartingScan } = useScanPullRequest(
      orgId,
      repoId,
      id,
    );

    const onScanClick = useCallback(async () => {
      try {
        await handleScanNow();
      } catch {
        // Handled in useScanPullRequest (toast).
      }
    }, [handleScanNow]);

    return (
      <div className="flex flex-col gap-3 rounded-lg border border-primary-500/45 bg-surface-tinted px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex flex-wrap items-center gap-2.5">
            <Icon icon="TbSparkles" size={15} className="text-primary-300" />
            <span className="font-mono text-[13px] font-semibold text-primary-100">
              AI Summary
            </span>
            {(isStale || summary?.model) && (
              <Badge tone={isStale ? "neutral" : "primary"} weight="normal">
                {isStale ? AI_SUMMARY_STALE_STATE.badge : summary?.model}
              </Badge>
            )}
            {isDone && riskStyle && summary?.riskLevel && (
              <Badge palette={riskStyle}>
                RISK · {AI_SUMMARY_RISK_LABEL[summary.riskLevel]}
              </Badge>
            )}
          </span>

          <span className="flex flex-wrap items-center gap-2.5">
            {summary?.generatedAt && (
              <span className="font-mono text-[10.5px] text-text-muted">
                {summary.cached ? "cache · " : ""}
                {formatRelativeTime(summary.generatedAt)}
              </span>
            )}

            {/* A blocked run is either fixed in Settings or, when stale, run via
                the body's "Run AI review" — the header button would be a
                duplicate or a guaranteed 412. */}
            {!blockedView && (
              <Button
                type="button"
                variant="ghost-primary"
                size="sm"
                fullWidth={false}
                onClick={onRegenerateClick}
                disabled={isRegenerateDisabled}
                icon={
                  <Icon
                    icon="TbRefresh"
                    size={12}
                    className={
                      isRegenerateDisabled ? "animate-spin" : undefined
                    }
                  />
                }
                className="gap-1.5 font-mono"
              >
                Regenerate
              </Button>
            )}
          </span>
        </div>

        {isInProgress && (
          <div className="flex flex-col gap-2.5">
            <span className="flex items-center gap-2 font-mono text-[12px] text-primary-200">
              <Spinner size={13} className="text-primary-200" />
              Menganalisis {filesChanged} file
              {summary?.model ? ` · ${summary.model}` : ""}
            </span>
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-5/6 rounded" />
              <Skeleton className="h-3 w-2/3 rounded" />
            </div>
            <span className="text-[11.5px] text-text-faint">
              Temuan dari rule statis di bawah sudah final.
            </span>
          </div>
        )}

        {isDone && summary?.summaryMd && (
          <Markdown tone="ai">{summary.summaryMd}</Markdown>
        )}

        {status === "failed" && (
          <p className="text-[12.5px] text-danger-light">
            {getErrorMessage(summary?.error) ?? "Analisis AI gagal dijalankan."}
          </p>
        )}

        {blockedView && (
          <AiBlockedNotice
            view={blockedView}
            settingsHref={settingsHref}
            onRun={onRegenerateClick}
            isRunning={isRegenerateDisabled}
            onScan={onScanClick}
            isScanning={isStartingScan}
          />
        )}

        {(!blockedView || isNoScan) && (
          <div className="flex flex-wrap gap-2">
            {hasScan && !blockedView && (
              <>
                <Badge tone="red" size="md" weight="normal">
                  {criticalCount} critical
                </Badge>
                <Badge tone="orange" size="md" weight="normal">
                  {suggestionCount} suggestions
                </Badge>
              </>
            )}
            <Badge tone="neutral" size="md" weight="normal">
              {filesChanged} files · +{additions} −{deletions}
            </Badge>
          </div>
        )}
      </div>
    );
  },
);

AiSummaryCard.displayName = "AiSummaryCard";

export default AiSummaryCard;
