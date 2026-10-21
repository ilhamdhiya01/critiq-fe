import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Finding } from "@/lib/types/pull-request.types";
import { useDiffJumpStore } from "@/stores/useDiffJumpStore";

import FindingItem from "../FindingItem";

const FINDING = (overrides: Partial<Finding> = {}): Finding => ({
  id: "f1",
  source: "STATIC",
  ruleId: "secret",
  severity: "CRITICAL",
  title: "Hardcoded secret",
  message: "Move the key to an environment variable.",
  filePath: "src/config.ts",
  lineStart: 12,
  lineEnd: 12,
  snippet: null,
  ...overrides,
});

describe("FindingItem", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useDiffJumpStore.setState({ target: null });
  });

  afterEach(() => {
    vi.useRealTimers();
    useDiffJumpStore.setState({ target: null });
  });

  it("jumps to the line in the diff and clears the highlight after 2s", () => {
    render(<FindingItem finding={FINDING()} canJump />);

    fireEvent.click(screen.getByRole("button", { name: "src/config.ts:12" }));

    expect(useDiffJumpStore.getState().target).toEqual({
      filePath: "src/config.ts",
      line: 12,
    });

    act(() => vi.advanceTimersByTime(1999));
    expect(useDiffJumpStore.getState().target).not.toBeNull();

    act(() => vi.advanceTimersByTime(1));
    expect(useDiffJumpStore.getState().target).toBeNull();
  });

  it("restarts the countdown on a second jump", () => {
    render(<FindingItem finding={FINDING()} canJump />);
    const jump = screen.getByRole("button", { name: "src/config.ts:12" });

    fireEvent.click(jump);
    act(() => vi.advanceTimersByTime(1500));
    fireEvent.click(jump);
    act(() => vi.advanceTimersByTime(1500));

    expect(useDiffJumpStore.getState().target).not.toBeNull();

    act(() => vi.advanceTimersByTime(500));
    expect(useDiffJumpStore.getState().target).toBeNull();
  });

  it("cancels the pending clear on unmount", () => {
    const { unmount } = render(<FindingItem finding={FINDING()} canJump />);

    fireEvent.click(screen.getByRole("button", { name: "src/config.ts:12" }));
    unmount();
    // A target set by someone else must survive the old timer.
    useDiffJumpStore.setState({ target: { filePath: "other.ts", line: 1 } });
    act(() => vi.advanceTimersByTime(5000));

    expect(useDiffJumpStore.getState().target).toEqual({
      filePath: "other.ts",
      line: 1,
    });
  });

  it("shows the location as plain text when the line is not in the diff", () => {
    render(<FindingItem finding={FINDING()} canJump={false} />);

    expect(
      screen.queryByRole("button", { name: "src/config.ts:12" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("src/config.ts:12")).toHaveAttribute(
      "title",
      "Baris ini tidak ada di diff yang ditampilkan",
    );
  });
});
