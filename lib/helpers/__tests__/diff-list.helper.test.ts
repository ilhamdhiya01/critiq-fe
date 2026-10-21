import { describe, expect, it } from "vitest";

import type { ParsedPullRequestFile } from "@/lib/types/pull-request.types";

import { buildDiffList, findHeaderAt, getDiffJumpKey } from "../diff.helper";

const file = (
  path: string,
  overrides: Partial<ParsedPullRequestFile> = {},
): ParsedPullRequestFile =>
  ({
    path,
    previousPath: null,
    status: "modified",
    additions: 1,
    deletions: 0,
    patch: "@@",
    truncated: false,
    addedCount: 1,
    removedCount: 0,
    lines: [
      { type: "hunk", oldLineNumber: null, newLineNumber: null, content: "@@" },
      { type: "removed", oldLineNumber: 4, newLineNumber: null, content: "a" },
      { type: "added", oldLineNumber: null, newLineNumber: 4, content: "b" },
    ],
    ...overrides,
  }) as ParsedPullRequestFile;

describe("buildDiffList", () => {
  it("flattens files into header, lines and an end row each", () => {
    const list = buildDiffList([
      file("a.ts"),
      file("b.ts", { patch: null, lines: [], truncated: true }),
    ]);

    expect(list.items).toEqual([
      { kind: "header", fileIndex: 0 },
      { kind: "line", fileIndex: 0, lineIndex: 0 },
      { kind: "line", fileIndex: 0, lineIndex: 1 },
      { kind: "line", fileIndex: 0, lineIndex: 2 },
      { kind: "end", fileIndex: 0 },
      { kind: "header", fileIndex: 1 },
      { kind: "message", fileIndex: 1, message: "unavailable" },
      { kind: "message", fileIndex: 1, message: "truncated" },
      { kind: "end", fileIndex: 1 },
    ]);
    expect(list.headerIndexes).toEqual([0, 5]);
    expect(new Set(list.keys).size).toBe(list.items.length);
  });

  it("indexes post-change lines for jumping to a finding", () => {
    const list = buildDiffList([file("a.ts")]);

    expect(list.lineIndexByKey.get(getDiffJumpKey("a.ts", 4))).toBe(3);
    // Removed lines have no new line number to jump to.
    expect(list.lineIndexByKey.size).toBe(1);
  });
});

describe("findHeaderAt", () => {
  it("finds the last header starting at or before the offset", () => {
    const starts = [0, 120, 480];

    expect(findHeaderAt(starts, -1)).toBe(-1);
    expect(findHeaderAt(starts, 0)).toBe(0);
    expect(findHeaderAt(starts, 119)).toBe(0);
    expect(findHeaderAt(starts, 120)).toBe(1);
    expect(findHeaderAt(starts, 9999)).toBe(2);
    expect(findHeaderAt([], 10)).toBe(-1);
  });
});
