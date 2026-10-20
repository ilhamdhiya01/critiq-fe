"use client";

import classNames from "classnames";
import React, { useCallback, useMemo, useState } from "react";

import { getDiffLineElementId } from "@/lib/helpers/diff.helper";
import {
  getDiffLinePosition,
  getInlineThreadKey,
} from "@/lib/helpers/pull-request.helper";
import type {
  CommentScope,
  CommentThread,
  DiffLineFlag,
  Finding,
  ParsedPullRequestFile,
} from "@/lib/types/pull-request.types";
import { useDiffJumpStore } from "@/stores/useDiffJumpStore";

import CommentThreadView from "../CommentThreadView";
import DiffLineRow from "./DiffLineRow";
import DiffNewComment from "./DiffNewComment";

interface DiffFileProps {
  file: ParsedPullRequestFile;
  isFirst: boolean;
  findings?: Finding[];
  // Current (non-outdated) inline threads by getInlineThreadKey.
  threadsByKey: Record<string, CommentThread[]>;
  scope: CommentScope;
}

const THREAD_ROW =
  "flex flex-col gap-3 border-y border-border-subtle bg-sunken py-3 pr-5 pl-23";

// Findings use the API's uppercase severity; the diff gutter has its own
// two-level scale. Anything below MAJOR is not surfaced on a line.
const FLAG_SEVERITY: Record<string, DiffLineFlag["severity"] | undefined> = {
  CRITICAL: "critical",
  MAJOR: "warning",
};

const DiffFile = React.memo(
  ({ file, isFirst, findings, threadsByKey, scope }: DiffFileProps) => {
    const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
    // Inline comments need a known head commit to anchor to.
    const canStartThread = scope.canComment && !!scope.headSha;

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

    const handleCloseComment = useCallback(() => setActiveLineIndex(null), []);

    return (
      <div>
        {/* Sticks flush under the PR sticky bar until the next file (top-9:
            see PullRequestStickyBar). */}
        <div
          className={classNames(
            "sticky top-9 z-20 flex items-center justify-between gap-4 border-b border-border-subtle px-5 py-3",
            { "bg-surface": isFirst, "border-t bg-sunken": !isFirst },
          )}
        >
          <span className="min-w-0 truncate font-mono text-[12.5px] font-semibold text-text-strong">
            {displayPath}
          </span>
          <span className="shrink-0 font-mono text-[11px] text-text-faint">
            UNIFIED · +{file.addedCount} −{file.removedCount}
            {isFirst && canStartThread && " · KLIK BARIS UNTUK KOMENTAR"}
          </span>
        </div>

        <div className="py-2 font-mono text-xs leading-[1.9]">
          {hasPatch ? (
            file.lines.map((line, index) => {
              const position = getDiffLinePosition(line);
              const lineThreads = position
                ? threadsByKey[
                    getInlineThreadKey(file.path, position.side, position.line)
                  ]
                : undefined;
              const isActive = activeLineIndex === index;

              return (
                <React.Fragment key={index}>
                  <DiffLineRow
                    line={line}
                    index={index}
                    isActive={isActive}
                    onSelect={handleSelectLine}
                    isSelectable={canStartThread && !!position}
                    commentCount={lineThreads?.length ?? 0}
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
                  {lineThreads && lineThreads.length > 0 && (
                    <div className={THREAD_ROW}>
                      {lineThreads.map((thread) => (
                        <CommentThreadView
                          key={thread.id}
                          thread={thread}
                          scope={scope}
                          size="sm"
                        />
                      ))}
                    </div>
                  )}
                  {isActive && position && scope.headSha && (
                    <div className={THREAD_ROW}>
                      <DiffNewComment
                        path={file.path}
                        side={position.side}
                        line={position.line}
                        headSha={scope.headSha}
                        scope={scope}
                        onDone={handleCloseComment}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })
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
  },
);

DiffFile.displayName = "DiffFile";

export default DiffFile;
