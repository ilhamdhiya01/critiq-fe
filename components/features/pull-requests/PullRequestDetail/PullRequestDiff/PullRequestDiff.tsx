"use client";

import {
  defaultRangeExtractor,
  type Range,
  useVirtualizer,
} from "@tanstack/react-virtual";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import StateStatus from "@/components/shared/state-status";
import {
  buildDiffList,
  type DiffListItem,
  findHeaderAt,
  getDiffJumpKey,
} from "@/lib/helpers/diff.helper";
import { getScrollParent } from "@/lib/helpers/dom.helper";
import {
  getDiffLinePosition,
  getInlineThreadKey,
} from "@/lib/helpers/pull-request.helper";
import { usePullRequestComments } from "@/lib/hooks/pull-requests/usePullRequestComments";
import type {
  CommentScope,
  CommentThread,
  DiffLineFlag,
  Finding,
  ParsedPullRequestFile,
} from "@/lib/types/pull-request.types";
import { useDiffJumpStore } from "@/stores/useDiffJumpStore";

import DiffFileHeader from "./DiffFileHeader";
import DiffLineItem from "./DiffLineItem";

interface PullRequestDiffProps {
  files: ParsedPullRequestFile[];
  truncated: boolean;
  findings?: Finding[];
  scope: CommentScope;
}

const EMPTY_FINDINGS: Finding[] = [];
const NO_THREADS: Record<string, CommentThread[]> = {};

// Findings use the API's uppercase severity; the diff gutter has its own
// two-level scale. Anything below MAJOR is not surfaced on a line.
const FLAG_SEVERITY: Record<string, DiffLineFlag["severity"] | undefined> = {
  CRITICAL: "critical",
  MAJOR: "warning",
};

const ESTIMATED_SIZE: Record<DiffListItem["kind"], number> = {
  header: 53,
  line: 23,
  message: 23,
  end: 8,
};
// Space under each header before the first line (part of the header item).
const HEADER_GAP_PX = 8;
// PullRequestStickyBar covers the top 60px of <main>'s scrollport; file
// headers pin right below it (the overlay's top-9 is the same line).
const STICKY_BAR_PX = 60;
// Rendered before the scroll container is measured (first paint, tests).
const INITIAL_RECT = { width: 0, height: 900 };

// The dashboard scrolls <main>. Outside it (tests) fall back to the document.
const resolveScrollElement = (element: HTMLElement | null) => {
  const parent = getScrollParent(element);
  return parent instanceof Window
    ? (document.scrollingElement as HTMLElement | null)
    : parent;
};

// Virtualised: only the rows near the viewport are in the DOM, so large PRs
// stay responsive.
const PullRequestDiff = React.memo(
  ({
    files,
    truncated,
    findings = EMPTY_FINDINGS,
    scope,
  }: PullRequestDiffProps) => {
    // One query for every file; each row looks up its own line.
    const { data: comments } = usePullRequestComments(
      scope.orgId,
      scope.repoId,
      scope.pullId,
    );
    const threadsByKey = comments?.inlineByKey ?? NO_THREADS;
    // Inline comments need a known head commit to anchor to.
    const canStartThread = scope.canComment && !!scope.headSha;

    const list = useMemo(() => buildDiffList(files), [files]);

    // path → line → flag. Findings address the post-change file, so they
    // join on newLineNumber; the first finding on a line wins (criticals are
    // listed before majors).
    const flagsByFile = useMemo(() => {
      const map = new Map<string, Map<number, DiffLineFlag>>();
      for (const finding of findings) {
        const severity = FLAG_SEVERITY[finding.severity];
        if (!severity) continue;
        const byLine = map.get(finding.filePath) ?? new Map();
        if (!byLine.has(finding.lineStart)) {
          byLine.set(finding.lineStart, { severity, label: finding.title });
        }
        map.set(finding.filePath, byLine);
      }
      return map;
    }, [findings]);

    const [activeLine, setActiveLine] = useState<{
      fileIndex: number;
      lineIndex: number;
    } | null>(null);

    const handleSelectLine = useCallback(
      (fileIndex: number, lineIndex: number) =>
        setActiveLine((current) =>
          current?.fileIndex === fileIndex && current.lineIndex === lineIndex
            ? null
            : { fileIndex, lineIndex },
        ),
      [],
    );
    const handleCloseComment = useCallback(() => setActiveLine(null), []);

    const threadsFor = useCallback(
      (file: ParsedPullRequestFile, lineIndex: number) => {
        const position = getDiffLinePosition(file.lines[lineIndex]);
        return position
          ? threadsByKey[
              getInlineThreadKey(file.path, position.side, position.line)
            ]
          : undefined;
      },
      [threadsByKey],
    );

    // Always rendered even off screen, so a comment draft or a reply being
    // typed survives scrolling away.
    const pinnedIndexes = useMemo(() => {
      const pinned: number[] = [];
      list.items.forEach((item, index) => {
        if (item.kind !== "line") return;
        const isActive =
          activeLine?.fileIndex === item.fileIndex &&
          activeLine.lineIndex === item.lineIndex;
        if (isActive || threadsFor(files[item.fileIndex], item.lineIndex)) {
          pinned.push(index);
        }
      });
      return pinned;
    }, [list, files, activeLine, threadsFor]);

    const listRef = useRef<HTMLDivElement>(null);
    const scrollElementRef = useRef<HTMLElement | null>(null);
    const getScrollElement = useCallback(() => {
      scrollElementRef.current ??= resolveScrollElement(listRef.current);
      return scrollElementRef.current;
    }, []);

    // Where the list starts inside the scroll container. Content above it
    // (summary, findings) changes height, so it's re-measured on resize.
    const [scrollMargin, setScrollMargin] = useState(0);
    useEffect(() => {
      const listElement = listRef.current;
      const scrollElement = getScrollElement();
      if (
        !listElement ||
        !scrollElement ||
        typeof ResizeObserver === "undefined"
      ) {
        return;
      }
      const measure = () =>
        setScrollMargin(
          listElement.getBoundingClientRect().top -
            scrollElement.getBoundingClientRect().top +
            scrollElement.scrollTop,
        );
      const observer = new ResizeObserver(measure);
      observer.observe(scrollElement.firstElementChild ?? listElement);
      return () => observer.disconnect();
    }, [getScrollElement]);

    // Stable callbacks: new ones would make the virtualizer recompute every
    // row's position on each render (it renders on scroll).
    const estimateSize = useCallback(
      (index: number) => ESTIMATED_SIZE[list.items[index].kind],
      [list],
    );
    const getItemKey = useCallback((index: number) => list.keys[index], [list]);
    const rangeExtractor = useCallback(
      (range: Range) => {
        const visible = defaultRangeExtractor(range);
        if (pinnedIndexes.length === 0) return visible;
        return [...new Set([...pinnedIndexes, ...visible])].sort(
          (a, b) => a - b,
        );
      },
      [pinnedIndexes],
    );

    const virtualizer = useVirtualizer({
      count: list.items.length,
      getScrollElement,
      estimateSize,
      getItemKey,
      rangeExtractor,
      scrollMargin,
      overscan: 15,
      initialRect: INITIAL_RECT,
      // Avoids React 19's flushSync-in-render warning.
      useFlushSync: false,
    });

    // Flagged Issues → scroll the virtual list (the row may not exist yet).
    const jumpTarget = useDiffJumpStore((state) => state.target);
    useEffect(() => {
      if (!jumpTarget) return;
      const index = list.lineIndexByKey.get(
        getDiffJumpKey(jumpTarget.filePath, jumpTarget.line),
      );
      if (index !== undefined) {
        virtualizer.scrollToIndex(index, { align: "center" });
      }
    }, [jumpTarget, list, virtualizer]);

    if (files.length === 0) {
      return <StateStatus title="Tidak ada perubahan file" />;
    }

    // Pinned header overlay: the file whose header has scrolled under the
    // sticky bar, pushed up as the next file's header arrives.
    const measurements = virtualizer.measurementsCache;
    const stickLine = (virtualizer.scrollOffset ?? 0) + STICKY_BAR_PX;
    const headerStarts = list.headerIndexes.map(
      (index) => measurements[index]?.start ?? 0,
    );
    const pinnedFile = findHeaderAt(headerStarts, stickLine);
    const listEnd = scrollMargin + virtualizer.getTotalSize();
    let overlayShift = 0;
    if (pinnedFile >= 0) {
      const header = measurements[list.headerIndexes[pinnedFile]];
      const headerHeight = (header?.size ?? 0) - HEADER_GAP_PX;
      const nextStart = headerStarts[pinnedFile + 1] ?? listEnd;
      overlayShift = Math.min(0, nextStart - stickLine - headerHeight);
    }
    const showOverlay =
      pinnedFile >= 0 &&
      stickLine > headerStarts[pinnedFile] &&
      stickLine < listEnd;

    const renderItem = (item: DiffListItem) => {
      const file = files[item.fileIndex];

      if (item.kind === "header") {
        return (
          <>
            <DiffFileHeader
              file={file}
              isFirst={item.fileIndex === 0}
              showCommentHint={item.fileIndex === 0 && canStartThread}
            />
            <div style={{ height: HEADER_GAP_PX }} />
          </>
        );
      }
      if (item.kind === "end") {
        return <div style={{ height: HEADER_GAP_PX }} />;
      }
      if (item.kind === "message") {
        return (
          <div className="px-5 font-mono text-xs leading-[1.9] text-text-muted">
            {item.message === "unavailable"
              ? "Diff tidak tersedia untuk file ini."
              : "Diff file ini dipotong."}
          </div>
        );
      }

      const line = file.lines[item.lineIndex];
      return (
        <DiffLineItem
          filePath={file.path}
          fileIndex={item.fileIndex}
          lineIndex={item.lineIndex}
          line={line}
          flag={
            line.newLineNumber !== null
              ? flagsByFile.get(file.path)?.get(line.newLineNumber)
              : undefined
          }
          threads={threadsFor(file, item.lineIndex)}
          isActive={
            activeLine?.fileIndex === item.fileIndex &&
            activeLine.lineIndex === item.lineIndex
          }
          canStartThread={canStartThread}
          scope={scope}
          onSelectLine={handleSelectLine}
          onCloseComment={handleCloseComment}
        />
      );
    };

    return (
      // overflow-clip (not hidden) keeps the rounded corners without breaking
      // the sticky header overlay.
      <div className="overflow-clip rounded-lg border border-border-subtle bg-surface">
        <div
          ref={listRef}
          className="relative"
          style={{ height: virtualizer.getTotalSize() }}
        >
          <div className="sticky top-9 z-20 h-0">
            {showOverlay && (
              <div
                aria-hidden
                data-testid="diff-pinned-header"
                className="absolute inset-x-0 top-0"
                style={{ transform: `translateY(${overlayShift}px)` }}
              >
                <DiffFileHeader
                  file={files[pinnedFile]}
                  isFirst={pinnedFile === 0}
                  showCommentHint={false}
                />
              </div>
            )}
          </div>
          {virtualizer.getVirtualItems().map((virtualItem) => (
            <div
              key={virtualItem.key}
              ref={virtualizer.measureElement}
              data-index={virtualItem.index}
              className="absolute inset-x-0 top-0"
              style={{
                transform: `translateY(${virtualItem.start - scrollMargin}px)`,
              }}
            >
              {renderItem(list.items[virtualItem.index])}
            </div>
          ))}
        </div>
        {truncated && (
          <div className="border-t border-border-subtle px-5 py-3 font-mono text-[11px] text-text-faint">
            Sebagian file tidak ditampilkan karena diff terlalu besar.
          </div>
        )}
      </div>
    );
  },
);

PullRequestDiff.displayName = "PullRequestDiff";

export default PullRequestDiff;
