"use client";

import React, { useCallback } from "react";

import { getDiffLinePosition } from "@/lib/helpers/pull-request.helper";
import type {
  CommentScope,
  CommentThread,
  DiffLine,
  DiffLineFlag,
} from "@/lib/types/pull-request.types";
import { useDiffJumpStore } from "@/stores/useDiffJumpStore";

import CommentThreadView from "../CommentThreadView";
import DiffLineRow from "./DiffLineRow";
import DiffNewComment from "./DiffNewComment";

const THREAD_ROW =
  "flex flex-col gap-3 border-y border-border-subtle bg-sunken py-3 pr-5 pl-23";

interface DiffLineItemProps {
  filePath: string;
  fileIndex: number;
  lineIndex: number;
  line: DiffLine;
  flag?: DiffLineFlag;
  threads?: CommentThread[];
  isActive: boolean;
  canStartThread: boolean;
  scope: CommentScope;
  onSelectLine: (fileIndex: number, lineIndex: number) => void;
  onCloseComment: () => void;
}

// One virtualised row: the diff line plus its threads and comment form.
const DiffLineItem = React.memo(
  ({
    filePath,
    fileIndex,
    lineIndex,
    line,
    flag,
    threads,
    isActive,
    canStartThread,
    scope,
    onSelectLine,
    onCloseComment,
  }: DiffLineItemProps) => {
    // Narrow selector: only the jumped-to row re-renders.
    const isHighlighted = useDiffJumpStore(
      (state) =>
        line.newLineNumber !== null &&
        state.target?.filePath === filePath &&
        state.target.line === line.newLineNumber,
    );
    // Where a comment on this line anchors; null for hunk headers. Derived
    // here so the parent (which re-renders on scroll) passes only stable props.
    const position = getDiffLinePosition(line);
    const handleSelect = useCallback(
      (index: number) => onSelectLine(fileIndex, index),
      [onSelectLine, fileIndex],
    );

    return (
      <div className="font-mono text-xs leading-[1.9]">
        <DiffLineRow
          line={line}
          index={lineIndex}
          isActive={isActive}
          onSelect={handleSelect}
          isSelectable={canStartThread && !!position}
          commentCount={threads?.length ?? 0}
          flag={flag}
          isHighlighted={isHighlighted}
        />
        {threads && threads.length > 0 && (
          <div className={THREAD_ROW}>
            {threads.map((thread) => (
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
              path={filePath}
              side={position.side}
              line={position.line}
              headSha={scope.headSha}
              scope={scope}
              onDone={onCloseComment}
            />
          </div>
        )}
      </div>
    );
  },
);

DiffLineItem.displayName = "DiffLineItem";

export default DiffLineItem;
