import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";

import type {
  Finding,
  FindingSeverity,
  ParsedPullRequestFile,
} from "@/lib/types/pull-request.types";
import { useDiffJumpStore } from "@/stores/useDiffJumpStore";

import FlaggedIssues from "../FlaggedIssues";

const finding = (
  id: string,
  severity: FindingSeverity,
  lineStart: number,
  filePath = "src/a.ts",
): Finding => ({
  id,
  source: "STATIC",
  ruleId: `rule_${id}`,
  severity,
  title: `Title ${id}`,
  message: `Message ${id}`,
  filePath,
  lineStart,
  lineEnd: lineStart,
  snippet: null,
});

const FILE = {
  path: "src/a.ts",
  previousPath: null,
  status: "modified",
  additions: 1,
  deletions: 1,
  patch: "@@",
  truncated: false,
  addedCount: 1,
  removedCount: 1,
  lines: [
    { type: "hunk", oldLineNumber: null, newLineNumber: null, content: "@@" },
    { type: "context", oldLineNumber: 1, newLineNumber: 1, content: "a" },
    { type: "removed", oldLineNumber: 9, newLineNumber: null, content: "b" },
    { type: "added", oldLineNumber: null, newLineNumber: 2, content: "c" },
  ],
} as ParsedPullRequestFile;

describe("FlaggedIssues", () => {
  afterEach(() => {
    useDiffJumpStore.setState({ target: null });
  });

  it("lets only findings whose new-side line is in the diff jump to it", () => {
    render(
      <FlaggedIssues
        findings={[
          finding("c1", "CRITICAL", 2),
          // Line 9 exists only on the old side (removed) — no row to land on.
          finding("c2", "CRITICAL", 9),
          finding("c3", "CRITICAL", 1, "src/missing.ts"),
          finding("m1", "MAJOR", 1),
        ]}
        files={[FILE]}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "src/a.ts:9" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "src/missing.ts:1" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "src/a.ts:2" }));
    expect(useDiffJumpStore.getState().target).toEqual({
      filePath: "src/a.ts",
      line: 2,
    });

    // Suggestions are jumpable too.
    fireEvent.click(screen.getByRole("button", { name: "src/a.ts:1" }));
    expect(useDiffJumpStore.getState().target).toEqual({
      filePath: "src/a.ts",
      line: 1,
    });
  });
});
