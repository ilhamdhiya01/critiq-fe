"use client";

import classNames from "classnames";
import React, { useCallback, useState } from "react";

import type {
  ParsedPullRequestFile,
  PullRequestComment,
} from "@/lib/types/pull-request.types";

import DiffCommentThread from "./DiffCommentThread";
import DiffLineRow from "./DiffLineRow";

interface DiffFileProps {
  file: ParsedPullRequestFile;
  isFirst: boolean;
}

const DiffFile = React.memo(({ file, isFirst }: DiffFileProps) => {
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
  const [threads, setThreads] = useState<Record<number, PullRequestComment[]>>(
    {},
  );

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
