"use client";

import React, { useCallback, useMemo, useState } from "react";

import Icon from "@/components/ui/icon/Icon";
import type {
  Finding,
  ParsedPullRequestFile,
} from "@/lib/types/pull-request.types";

import FindingItem from "./FindingItem";

const COLLAPSED_LIMIT = 5;

// Dummy — backend belum expose finding yang di-skip (butuh field skipReason
// yang belum ada di tipe Finding). Angka dan teks meniru mockup v5 persis.
const DUMMY_SKIPPED = [
  {
    title: "Database connection string with embedded password",
    location: "src/auth/config.spec.ts:11",
    reason: "test file",
  },
  {
    title: "AWS access key committed",
    location: "src/auth/session.ts:12",
    reason: "inside a comment",
  },
];

interface ShowMoreToggleProps {
  isExpanded: boolean;
  hiddenCount: number;
  onToggle: () => void;
}

const ShowMoreToggle = React.memo(
  ({ isExpanded, hiddenCount, onToggle }: ShowMoreToggleProps) => (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full cursor-pointer items-center justify-center gap-1.5 border-t border-border-subtle px-5 py-2.5 font-mono text-[11.5px] text-text-nav hover:bg-surface-hover hover:text-text-strong"
    >
      {isExpanded
        ? "Tampilkan lebih sedikit"
        : `Tampilkan ${hiddenCount} lainnya`}
      <Icon icon={isExpanded ? "TbChevronUp" : "TbChevronDown"} size={13} />
    </button>
  ),
);

ShowMoreToggle.displayName = "ShowMoreToggle";

interface FlaggedIssuesProps {
  findings: Finding[];
  files: ParsedPullRequestFile[];
  truncated?: boolean;
}

const FlaggedIssues = React.memo(
  ({ findings, files, truncated = false }: FlaggedIssuesProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(true);
    const [isSuggestionsExpanded, setIsSuggestionsExpanded] = useState(false);
    const [isSkippedOpen, setIsSkippedOpen] = useState(false);

    const criticalFindings = useMemo(
      () => findings.filter((finding) => finding.severity === "CRITICAL"),
      [findings],
    );
    const suggestionFindings = useMemo(
      () =>
        findings.filter(
          (finding) =>
            finding.severity === "MAJOR" || finding.severity === "MINOR",
        ),
      [findings],
    );

    // A finding is only linkable if its exact line is rendered in the diff —
    // a truncated file, or a line the patch never touched, has no row to
    // scroll to. Built once per diff rather than queried on every click.
    const renderedLines = useMemo(() => {
      const byFile = new Map<string, Set<number>>();
      for (const file of files) {
        const lines = new Set<number>();
        for (const line of file.lines) {
          if (line.newLineNumber !== null) lines.add(line.newLineNumber);
        }
        byFile.set(file.path, lines);
      }
      return byFile;
    }, [files]);

    const hasMore = criticalFindings.length > COLLAPSED_LIMIT;
    const visibleFindings = isExpanded
      ? criticalFindings
      : criticalFindings.slice(0, COLLAPSED_LIMIT);

    const hasMoreSuggestions = suggestionFindings.length > COLLAPSED_LIMIT;
    const visibleSuggestions = isSuggestionsExpanded
      ? suggestionFindings
      : suggestionFindings.slice(0, COLLAPSED_LIMIT);

    const handleToggleExpanded = useCallback(
      () => setIsExpanded((current) => !current),
      [],
    );
    const handleToggleSuggestions = useCallback(
      () => setIsSuggestionsOpen((current) => !current),
      [],
    );
    const handleToggleSuggestionsExpanded = useCallback(
      () => setIsSuggestionsExpanded((current) => !current),
      [],
    );
    const handleToggleSkipped = useCallback(
      () => setIsSkippedOpen((current) => !current),
      [],
    );

    // A pull request with nothing flagged shows no card at all — an empty
    // "Flagged Issues (0)" would read as a problem rather than a clean scan.
    // if (criticalFindings.length === 0) return null;

    const skippedLabel = `${DUMMY_SKIPPED.length} skipped (${DUMMY_SKIPPED.map((item) => item.reason).join(", ")})`;

    return (
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
        <div className="flex items-center justify-between gap-4 border-b border-border-subtle px-5 py-3.5">
          <span className="font-mono text-[13px] font-semibold text-text-strong">
            Flagged Issues{" "}
            <span className="text-danger-light">
              ({criticalFindings.length})
            </span>
          </span>
          <span className="font-mono text-[11px] text-text-muted">
            CRITICAL · SORTED BY FILE
          </span>
        </div>

        {visibleFindings.map((finding) => (
          <FindingItem
            key={finding.id}
            finding={finding}
            canJump={
              renderedLines.get(finding.filePath)?.has(finding.lineStart) ??
              false
            }
          />
        ))}

        {hasMore && (
          <ShowMoreToggle
            isExpanded={isExpanded}
            hiddenCount={criticalFindings.length - COLLAPSED_LIMIT}
            onToggle={handleToggleExpanded}
          />
        )}

        {suggestionFindings.length > 0 && (
          <>
            <div className="flex items-center justify-between border-t border-border-subtle bg-raised px-5 py-2">
              <span className="font-mono text-[10.5px] text-text-muted">
                SUGGESTIONS · NOT COUNTED ABOVE
              </span>
              <button
                type="button"
                onClick={handleToggleSuggestions}
                className="cursor-pointer font-mono text-[11px] text-text-nav underline decoration-dotted underline-offset-2 hover:text-text-strong"
              >
                {isSuggestionsOpen
                  ? "hide"
                  : `show ${suggestionFindings.length}`}
              </button>
            </div>
            {isSuggestionsOpen && (
              <>
                {visibleSuggestions.map((finding) => (
                  <FindingItem
                    key={finding.id}
                    finding={finding}
                    canJump={
                      renderedLines
                        .get(finding.filePath)
                        ?.has(finding.lineStart) ?? false
                    }
                  />
                ))}
                {hasMoreSuggestions && (
                  <ShowMoreToggle
                    isExpanded={isSuggestionsExpanded}
                    hiddenCount={suggestionFindings.length - COLLAPSED_LIMIT}
                    onToggle={handleToggleSuggestionsExpanded}
                  />
                )}
              </>
            )}
          </>
        )}

        {/* <div className="flex items-center justify-between border-t border-border-subtle bg-raised px-5 py-2">
          <span className="font-mono text-[10.5px] text-text-muted">
            {skippedLabel}
          </span>
          <button
            type="button"
            onClick={handleToggleSkipped}
            className="cursor-pointer font-mono text-[11px] text-text-nav underline decoration-dotted underline-offset-2 hover:text-text-strong"
          >
            {isSkippedOpen ? "hide" : "show"}
          </button>
        </div> */}
        {/* {isSkippedOpen &&
          DUMMY_SKIPPED.map((item) => (
            <div
              key={item.location}
              className="flex items-start gap-3.5 border-b border-border-row px-5 py-3.5 opacity-65 last:border-b-0"
            >
              <span className="inline-flex shrink-0 items-center rounded-full border border-border-default bg-raised px-2.5 py-0.5 font-mono text-[10.5px] font-semibold tracking-[0.03em] whitespace-nowrap text-text-muted">
                SKIPPED
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-xs font-semibold text-neutral-300">
                  {item.title} <span className="text-text-faint">·</span>{" "}
                  <span className="font-mono font-normal text-text-faint">
                    {item.location}
                  </span>{" "}
                  <span className="font-mono font-normal text-text-muted">
                    · {item.reason}
                  </span>
                </span>
              </div>
            </div>
          ))} */}

        {truncated && (
          <div className="border-t border-border-subtle px-5 py-3 font-mono text-[11px] text-text-faint">
            Sebagian temuan tidak ditampilkan karena jumlahnya terlalu banyak.
          </div>
        )}
      </div>
    );
  },
);

FlaggedIssues.displayName = "FlaggedIssues";

export default FlaggedIssues;
