import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CommentScope, DiffLine } from "@/lib/types/pull-request.types";
import { createPullRequestComment } from "@/services/pull-requests.service";
import { useDiffJumpStore } from "@/stores/useDiffJumpStore";

import DiffLineItem from "../DiffLineItem";

vi.mock("@/services/pull-requests.service", () => ({
  createPullRequestComment: vi.fn(),
  retryCommentSync: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const SCOPE: CommentScope = {
  orgId: "org_1",
  repoId: "repo_1",
  pullId: "pr_1",
  headSha: "sha_head",
  providerName: "GitHub",
  canComment: true,
};

const ADDED: DiffLine = {
  type: "added",
  oldLineNumber: null,
  newLineNumber: 11,
  content: "newCall();",
};

const renderItem = (
  props: Partial<React.ComponentProps<typeof DiffLineItem>> = {},
) => {
  const onSelectLine = vi.fn();
  const onCloseComment = vi.fn();
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <DiffLineItem
        filePath="src/a.ts"
        fileIndex={2}
        lineIndex={5}
        line={ADDED}
        isActive={false}
        canStartThread
        scope={SCOPE}
        onSelectLine={onSelectLine}
        onCloseComment={onCloseComment}
        {...props}
      />
    </QueryClientProvider>,
  );
  return { onSelectLine, onCloseComment };
};

const row = () => screen.getByText("newCall();").parentElement as HTMLElement;

describe("DiffLineItem", () => {
  beforeEach(() => {
    vi.mocked(createPullRequestComment).mockReset();
    useDiffJumpStore.setState({ target: null });
  });

  afterEach(() => {
    useDiffJumpStore.setState({ target: null });
  });

  it("selects this file's line when the viewer can comment", () => {
    const { onSelectLine } = renderItem();

    fireEvent.click(screen.getByText("newCall();"));

    expect(onSelectLine).toHaveBeenCalledWith(2, 5);
  });

  it("does not open a thread for Viewers", () => {
    const { onSelectLine } = renderItem({ canStartThread: false });

    fireEvent.click(screen.getByText("newCall();"));

    expect(onSelectLine).not.toHaveBeenCalled();
  });

  it("shows the composer for the active line and closes it on cancel", () => {
    const { onCloseComment } = renderItem({ isActive: true });

    expect(
      screen.getByRole("textbox", { name: "Komentari src/a.ts:11…" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Batal" }));
    expect(onCloseComment).toHaveBeenCalledTimes(1);
  });

  it("has no composer until the head commit is known", () => {
    renderItem({ isActive: true, scope: { ...SCOPE, headSha: null } });

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("rings the line a finding jumped to, and only that line", () => {
    renderItem();

    act(() =>
      useDiffJumpStore.setState({ target: { filePath: "src/b.ts", line: 11 } }),
    );
    expect(row()).not.toHaveClass("ring-1");

    act(() =>
      useDiffJumpStore.setState({ target: { filePath: "src/a.ts", line: 11 } }),
    );
    expect(row()).toHaveClass("ring-1");

    act(() => useDiffJumpStore.getState().clearTarget());
    expect(row()).not.toHaveClass("ring-1");
  });
});
