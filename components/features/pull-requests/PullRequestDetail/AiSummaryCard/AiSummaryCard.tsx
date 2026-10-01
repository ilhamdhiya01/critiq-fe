"use client";

import classNames from "classnames";
import React, { useCallback } from "react";
import Markdown from "react-markdown";

import Icon from "@/components/ui/icon/Icon";
import {
  AI_SUMMARY_RISK_LABEL,
  AI_SUMMARY_RISK_STYLE,
} from "@/const/pull-request.constant";
import { formatRelativeTime } from "@/lib/helpers/date.helper";
import { useRegeneratePullRequestSummary } from "@/lib/hooks/pull-requests/useRescanPullRequest";
import type {
  AiSummaryStatus,
  PullRequestSummary,
} from "@/lib/types/pull-request.types";

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

const BLOCKED_MESSAGE: Record<
  Exclude<AiSummaryStatus, "queued" | "running" | "done" | "cached" | "failed">,
  string
> = {
  skipped_manual_mode:
    "Review manual saja — AI tidak dijalankan untuk branch ini.",
  consent_required:
    "Analisis AI butuh persetujuan organisasi sebelum bisa berjalan.",
  not_configured: "Analisis AI belum dikonfigurasi untuk repositori ini.",
  skipped_too_large: "Perubahan terlalu besar untuk dianalisis AI.",
  budget_exceeded: "Kuota analisis AI organisasi sudah habis.",
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
  }: AiSummaryCardProps) => {
    console.log(summary);
    const status = summary?.aiStatus;
    const isInProgress = status === "queued" || status === "running";
    const isDone = status === "done" || status === "cached";
    const riskStyle = summary?.riskLevel
      ? AI_SUMMARY_RISK_STYLE[summary.riskLevel]
      : null;

    const { handleRegenerate, isRegenerating } =
      useRegeneratePullRequestSummary(orgId, repoId, id);
    const isRegenerateDisabled = isRegenerating || isInProgress;

    const onRegenerateClick = useCallback(() => {
      handleRegenerate();
    }, [handleRegenerate]);

    return (
      <div className="flex flex-col gap-3 rounded-lg border border-primary-500/45 bg-surface-tinted px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex flex-wrap items-center gap-2.5">
            <Icon icon="TbSparkles" size={15} className="text-primary-300" />
            <span className="font-mono text-[13px] font-semibold text-primary-100">
              AI Summary
            </span>
            {summary?.model && (
              <span className="rounded-full border border-primary-500/45 px-2.5 py-0.5 font-mono text-[10.5px] text-primary-300">
                {summary.model}
              </span>
            )}
            {isDone && riskStyle && summary?.riskLevel && (
              <span
                className={classNames(
                  "rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] font-semibold",
                  riskStyle.text,
                  riskStyle.bg,
                  riskStyle.border,
                )}
              >
                RISK · {AI_SUMMARY_RISK_LABEL[summary.riskLevel]}
              </span>
            )}
          </span>

          <span className="flex items-center gap-2.5">
            {summary?.generatedAt && (
              <span className="font-mono text-[10.5px] text-text-muted">
                {summary.cached ? "cache · " : ""}
                {formatRelativeTime(summary.generatedAt)}
              </span>
            )}

            <button
              type="button"
              onClick={onRegenerateClick}
              disabled={isRegenerateDisabled}
              className={classNames(
                "flex items-center gap-1.5 rounded-md border border-primary-500/45 px-3 py-1.5 font-mono text-[11.5px] text-primary-300",
                isRegenerateDisabled
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer hover:bg-primary-500/10",
              )}
            >
              <Icon
                icon="TbRefresh"
                size={12}
                className={isRegenerateDisabled ? "animate-spin" : undefined}
              />
              Regenerate
            </button>
          </span>
        </div>

        {isInProgress && (
          <div className="flex flex-col gap-2.5">
            <span className="flex items-center gap-2 font-mono text-[12px] text-primary-200">
              <Icon icon="TbLoader2" size={13} className="animate-spin" />
              Menganalisis {filesChanged} file
              {summary?.model ? ` · ${summary.model}` : ""}
            </span>
            <div className="flex flex-col gap-1.5">
              <div className="animate-shimmer h-3 w-full rounded" />
              <div className="animate-shimmer h-3 w-5/6 rounded" />
              <div className="animate-shimmer h-3 w-2/3 rounded" />
            </div>
            <span className="text-[11.5px] text-text-faint">
              Temuan dari rule statis di bawah sudah final.
            </span>
          </div>
        )}

        {isDone && summary?.summaryMd && (
          <div className="flex flex-col gap-2 text-[13px] leading-relaxed text-primary-100 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_p]:m-0 [&_strong]:font-semibold [&_strong]:text-primary-50 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
            <Markdown>{summary.summaryMd}</Markdown>
          </div>
        )}

        {status === "failed" && (
          <p className="text-[12.5px] text-danger-light">
            {getErrorMessage(summary?.error) ?? "Analisis AI gagal dijalankan."}
          </p>
        )}

        {status &&
          status in BLOCKED_MESSAGE &&
          (() => {
            const message =
              BLOCKED_MESSAGE[status as keyof typeof BLOCKED_MESSAGE];
            return <p className="text-[12.5px] text-text-faint">{message}</p>;
          })()}

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-danger/40 bg-danger/10 px-2.5 py-1 font-mono text-[11px] font-medium text-danger-light">
            {criticalCount} critical
          </span>
          <span className="rounded-full border border-warning/40 bg-warning/10 px-2.5 py-1 font-mono text-[11px] font-medium text-warning-light">
            {suggestionCount} suggestions
          </span>
          <span className="rounded-full border border-border-default bg-raised px-2.5 py-1 font-mono text-[11px] font-medium text-text-secondary">
            {filesChanged} files · +{additions} −{deletions}
          </span>
        </div>
      </div>
    );
  },
);

AiSummaryCard.displayName = "AiSummaryCard";

export default AiSummaryCard;
