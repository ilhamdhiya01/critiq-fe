import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  CommentScope,
  CommentThread,
  ParsedPullRequestFile,
} from "@/lib/types/pull-request.types";
import {
  createPullRequestComment,
  getPullRequestComments,
} from "@/services/pull-requests.service";
import { useDiffJumpStore } from "@/stores/useDiffJumpStore";

import PullRequestDiff from "../PullRequestDiff";

vi.mock("@/services/pull-requests.service", () => ({
  getPullRequestComments: vi.fn(),
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
    {
      type: "context",
      oldLineNumber: 10,
      newLineNumber: 10,
      content: "keep();",
    },
    {
      type: "removed",
      oldLineNumber: 11,
      newLineNumber: null,
      content: "oldCall();",
    },
    {
      type: "added",
      oldLineNumber: null,
      newLineNumber: 11,
      content: "newCall();",
    },
  ],
} as ParsedPullRequestFile;

const INLINE = (overrides: Partial<CommentThread>): CommentThread => ({
  id: "t1",
  kind: "inline",
  path: "src/a.ts",
  line: 11,
  side: "new",
  headSha: "sha_head",
  outdated: false,
  comments: [
    {
      id: "c1",
      origin: "critiq",
      author: {
        name: "Ilham",
        avatarUrl: null,
        critiqUserId: "u1",
        providerUsername: null,
      },
      body: "Why the new call?",
      createdAt: "2026-10-12T03:00:00Z",
      editedAt: null,
      deleted: false,
      sync: { status: "synced", error: null },
    },
  ],
  ...overrides,
});

const respond = (threads: CommentThread[]) =>
  ({ data: { threads } }) as Awaited<ReturnType<typeof getPullRequestComments>>;

const renderDiff = (scope: CommentScope = SCOPE) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <PullRequestDiff files={[FILE]} truncated={false} scope={scope} />
    </QueryClientProvider>,
  );

const commentOn = async (code: string, placeholder: string) => {
  fireEvent.click(screen.getByText(code));
  fireEvent.change(await screen.findByRole("textbox", { name: placeholder }), {
    target: { value: "Please check this" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Komentar" }));
};

describe("PullRequestDiff comments", { timeout: 15_000 }, () => {
  beforeEach(() => {
    vi.mocked(getPullRequestComments).mockReset();
    vi.mocked(getPullRequestComments).mockResolvedValue(respond([]));
    vi.mocked(createPullRequestComment).mockReset();
    vi.mocked(createPullRequestComment).mockResolvedValue({
      data: INLINE({}).comments[0],
    });
  });

  it("comments on an added line with the new-side position and head", async () => {
    renderDiff();
    await commentOn("newCall();", "Komentari src/a.ts:11…");

    await waitFor(() =>
      expect(createPullRequestComment).toHaveBeenCalledWith(
        "org_1",
        "repo_1",
        "pr_1",
        {
          body: "Please check this",
          inline: {
            path: "src/a.ts",
            line: 11,
            side: "new",
            headSha: "sha_head",
          },
        },
      ),
    );
  });

  it("comments on a removed line with the old-side line number", async () => {
    renderDiff();
    await commentOn("oldCall();", "Komentari src/a.ts:11…");

    await waitFor(() =>
      expect(createPullRequestComment).toHaveBeenCalledWith(
        "org_1",
        "repo_1",
        "pr_1",
        {
          body: "Please check this",
          inline: {
            path: "src/a.ts",
            line: 11,
            side: "old",
            headSha: "sha_head",
          },
        },
      ),
    );
  });

  it("pins current threads to their line and leaves outdated ones out", async () => {
    vi.mocked(getPullRequestComments).mockResolvedValue(
      respond([
        INLINE({}),
        INLINE({
          id: "t2",
          outdated: true,
          comments: [
            { ...INLINE({}).comments[0], id: "c9", body: "Old remark" },
          ],
        }),
      ]),
    );
    renderDiff();

    expect(await screen.findByText("Why the new call?")).toBeInTheDocument();
    expect(screen.queryByText("Old remark")).not.toBeInTheDocument();
  });

  it("does not let Viewers open a comment form", async () => {
    renderDiff({ ...SCOPE, canComment: false });
    await waitFor(() => expect(getPullRequestComments).toHaveBeenCalled());

    fireEvent.click(screen.getByText("newCall();"));
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/KLIK BARIS UNTUK KOMENTAR/),
    ).not.toBeInTheDocument();
  });
});

const LINE_COUNT = 2000;
const BIG_FILE = {
  ...FILE,
  path: "src/big.ts",
  additions: LINE_COUNT,
  deletions: 0,
  addedCount: LINE_COUNT,
  removedCount: 0,
  lines: Array.from({ length: LINE_COUNT }, (_, index) => ({
    type: "added",
    oldLineNumber: null,
    newLineNumber: index + 1,
    content: `line${index + 1}();`,
  })),
} as ParsedPullRequestFile;

const renderBig = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <PullRequestDiff
        files={[FILE, BIG_FILE]}
        truncated={false}
        scope={SCOPE}
      />
    </QueryClientProvider>,
  );

describe("PullRequestDiff virtualisation", { timeout: 15_000 }, () => {
  // jsdom has no layout: give every row a real row's height, otherwise all
  // measure 0px and the window slides.
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(23);
    vi.mocked(getPullRequestComments).mockReset();
    vi.mocked(getPullRequestComments).mockResolvedValue(respond([]));
    useDiffJumpStore.getState().clearTarget();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders only the rows near the viewport", async () => {
    renderBig();
    await waitFor(() => expect(getPullRequestComments).toHaveBeenCalled());

    expect(screen.getByText("newCall();")).toBeInTheDocument();
    expect(screen.getByText("line1();")).toBeInTheDocument();
    expect(screen.queryByText(`line${LINE_COUNT}();`)).not.toBeInTheDocument();
    expect(screen.getAllByText(/^line\d+\(\);$/).length).toBeLessThan(200);
  });

  it("keeps a far-away comment thread mounted", async () => {
    vi.mocked(getPullRequestComments).mockResolvedValue(
      respond([
        INLINE({
          id: "far",
          path: "src/big.ts",
          line: 1800,
          comments: [
            { ...INLINE({}).comments[0], id: "c_far", body: "Far remark" },
          ],
        }),
      ]),
    );
    renderBig();

    expect(await screen.findByText("Far remark")).toBeInTheDocument();
    expect(screen.getByText("line1800();")).toBeInTheDocument();
  });

  it("rings the line a finding jumps to", async () => {
    renderDiff();
    await waitFor(() => expect(getPullRequestComments).toHaveBeenCalled());

    act(() =>
      useDiffJumpStore.getState().setTarget({ filePath: "src/a.ts", line: 11 }),
    );

    expect(screen.getByText("newCall();").parentElement).toHaveClass(
      "ring-primary-400",
    );
    expect(screen.getByText("keep();").parentElement).not.toHaveClass(
      "ring-primary-400",
    );
  });
});
