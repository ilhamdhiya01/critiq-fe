"use client";

import classNames from "classnames";
import React, { useCallback, useMemo, useState } from "react";

import { getDiffLineElementId } from "@/lib/helpers/diff.helper";
import type {
  DiffLineFlag,
  Finding,
  ParsedPullRequestFile,
  PullRequestComment,
} from "@/lib/types/pull-request.types";
import { useDiffJumpStore } from "@/stores/useDiffJumpStore";

import DiffCommentThread from "./DiffCommentThread";
import DiffLineRow from "./DiffLineRow";

interface DiffFileProps {
  file: ParsedPullRequestFile;
  isFirst: boolean;
  findings?: Finding[];
}

// Findings use the API's uppercase severity; the diff gutter has its own
// two-level scale. Anything below MAJOR is not surfaced on a line.
const FLAG_SEVERITY: Record<string, DiffLineFlag["severity"] | undefined> = {
  CRITICAL: "critical",
  MAJOR: "warning",
};

const DiffFile = React.memo(({ file, isFirst, findings }: DiffFileProps) => {
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
  const [threads, setThreads] = useState<Record<number, PullRequestComment[]>>(
    {},
  );

  // Narrow selector: only this file's rows re-render when a jump lands here,
  // and it resolves to null for every other file.
  const highlightedLine = useDiffJumpStore((state) =>
    state.target?.filePath === file.path ? state.target.line : null,
  );

  // Findings address lines in the post-change file, so they join on
  // newLineNumber — removed lines have none and are never flagged. lineEnd
  // only bounds the related code for context; the marker itself belongs on
  // lineStart, the actual line the finding points at.
  const flagByLine = useMemo(() => {
    const map = new Map<number, DiffLineFlag>();
    for (const finding of findings ?? []) {
      if (finding.filePath !== file.path) continue;
      const severity = FLAG_SEVERITY[finding.severity];
      if (!severity) continue;
      // First finding on a line wins; criticals are listed before majors.
      if (!map.has(finding.lineStart)) {
        map.set(finding.lineStart, { severity, label: finding.title });
      }
    }
    return map;
  }, [findings, file.path]);

  const hasPatch = file.patch !== null && file.lines.length > 0;
  const displayPath =
    file.status === "renamed" && file.previousPath
      ? `${file.previousPath} → ${file.path}`
      : file.path;

  const handleSelectLine = useCallback((index: number) => {
    setActiveLineIndex((current) => (current === index ? null : index));
  }, []);

  const handleSubmitComment = useCallback(
    (body: string) => {
      if (activeLineIndex === null) return;
      const comment: PullRequestComment = {
        id: `${activeLineIndex}-${Date.now()}`,
        author: "Kamu",
        body,
        createdAt: new Date().toISOString(),
      };
      setThreads((current) => ({
        ...current,
        [activeLineIndex]: [...(current[activeLineIndex] ?? []), comment],
      }));
    },
    [activeLineIndex],
  );

  return (
    <div>
      <div
        className={classNames(
          "flex items-center justify-between border-b border-border-subtle px-5 py-3",
          { "border-t bg-sunken": !isFirst },
        )}
      >
        <span className="font-mono text-[12.5px] font-semibold text-text-strong">
          {displayPath}
        </span>
        <span className="font-mono text-[11px] text-text-faint">
          UNIFIED · +{file.addedCount} −{file.removedCount}
          {isFirst && " · KLIK BARIS UNTUK KOMENTAR"}
        </span>
      </div>

      <div className="py-2 font-mono text-xs leading-[1.9]">
        {hasPatch ? (
          file.lines.map((line, index) => (
            <React.Fragment key={index}>
              <DiffLineRow
                line={line}
                index={index}
                isActive={activeLineIndex === index}
                onSelect={handleSelectLine}
                flag={
                  line.newLineNumber !== null
                    ? flagByLine.get(line.newLineNumber)
                    : undefined
                }
                elementId={
                  line.newLineNumber !== null
                    ? getDiffLineElementId(file.path, line.newLineNumber)
                    : undefined
                }
                isHighlighted={
                  line.newLineNumber !== null &&
                  highlightedLine === line.newLineNumber
                }
              />
              {activeLineIndex === index && (
                <DiffCommentThread
                  path={file.path}
                  lineNumber={line.newLineNumber ?? line.oldLineNumber ?? 0}
                  comments={threads[index] ?? []}
                  onSubmit={handleSubmitComment}
                />
              )}
            </React.Fragment>
          ))
        ) : (
          <div className="px-5 text-text-muted">
            Diff tidak tersedia untuk file ini.
          </div>
        )}
        {file.truncated && (
          <div className="px-5 text-text-muted">Diff file ini dipotong.</div>
        )}
      </div>
    </div>
  );
});

DiffFile.displayName = "DiffFile";

export default DiffFile;
