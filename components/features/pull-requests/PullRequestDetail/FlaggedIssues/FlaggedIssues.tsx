"use client";

import React, { useMemo } from "react";

import type {
  Finding,
  ParsedPullRequestFile,
} from "@/lib/types/pull-request.types";

import FindingItem from "./FindingItem";

interface FlaggedIssuesProps {
  findings: Finding[];
  files: ParsedPullRequestFile[];
  truncated?: boolean;
}

const FlaggedIssues = React.memo(
  ({ findings, files, truncated = false }: FlaggedIssuesProps) => {
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

    // A pull request with nothing flagged shows no card at all — an empty
    // "Flagged Issues (0)" would read as a problem rather than a clean scan.
    if (findings.length === 0) return null;

    return (
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
        <div className="flex items-center justify-between gap-4 border-b border-border-subtle px-5 py-3.5">
          <span className="font-mono text-[13px] font-semibold text-text-strong">
            Flagged Issues{" "}
            <span className="text-danger-light">({findings.length})</span>
          </span>
          <span className="font-mono text-[11px] text-text-muted">
            SEVERITY SCOPE: CRITICAL ONLY
          </span>
        </div>

        {findings.map((finding) => (
          <FindingItem
            key={finding.id}
            finding={finding}
            canJump={
              renderedLines.get(finding.filePath)?.has(finding.lineStart) ??
              false
            }
          />
        ))}

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
