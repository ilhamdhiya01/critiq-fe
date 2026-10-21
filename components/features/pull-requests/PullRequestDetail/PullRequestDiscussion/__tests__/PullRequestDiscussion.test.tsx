import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  CommentScope,
  CommentThread,
  PullRequestComment,
} from "@/lib/types/pull-request.types";
import {
  createPullRequestComment,
  getPullRequestComments,
  retryCommentSync,
} from "@/services/pull-requests.service";

import PullRequestDiscussion from "../PullRequestDiscussion";

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

const COMMENT = (
  overrides: Partial<PullRequestComment>,
): PullRequestComment => ({
  id: "c1",
  origin: "critiq",
  author: {
    name: "Ilham Dhiya Ulhaq",
    avatarUrl: null,
    critiqUserId: "u1",
    providerUsername: null,
  },
  body: "Looks good",
  createdAt: "2026-10-12T03:00:00Z",
  editedAt: null,
  deleted: false,
  sync: { status: "synced", error: null },
  ...overrides,
});

const THREAD = (id: string, comments: PullRequestComment[]): CommentThread => ({
  id,
  kind: "general",
  path: null,
  line: null,
  side: null,
  headSha: null,
  outdated: false,
  comments,
});

const respond = (threads: CommentThread[]) =>
  ({ data: { threads } }) as Awaited<ReturnType<typeof getPullRequestComments>>;

const renderDiscussion = (scope: CommentScope = SCOPE) =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <PullRequestDiscussion scope={scope} />
    </QueryClientProvider>,
  );

describe("PullRequestDiscussion", () => {
  beforeEach(() => {
    vi.mocked(getPullRequestComments).mockReset();
    vi.mocked(createPullRequestComment).mockReset();
    vi.mocked(retryCommentSync).mockReset();
    vi.mocked(createPullRequestComment).mockResolvedValue({
      data: COMMENT({}),
    });
  });

  it("shows saved comments from the API (not local state)", async () => {
    vi.mocked(getPullRequestComments).mockResolvedValue(
      respond([THREAD("t1", [COMMENT({ body: "Saved **earlier**" })])]),
    );
    renderDiscussion();

    expect(await screen.findByText("earlier")).toBeInTheDocument();
    expect(screen.getByText("Ilham Dhiya Ulhaq")).toBeInTheDocument();
  });

  it("posts a general comment and shows it after the refetch", async () => {
    vi.mocked(getPullRequestComments)
      .mockResolvedValueOnce(respond([]))
      .mockResolvedValue(
        respond([THREAD("t1", [COMMENT({ body: "New note" })])]),
      );
    renderDiscussion();

    expect(await screen.findByText("Belum ada komentar.")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Tulis komentar…" }), {
      target: { value: "New note" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Komentar" }));

    await waitFor(() =>
      expect(createPullRequestComment).toHaveBeenCalledWith(
        "org_1",
        "repo_1",
        "pr_1",
        { body: "New note" },
      ),
    );
    expect(await screen.findByText("New note")).toBeInTheDocument();
  });

  it("replies with parentId and shows the reply in the same thread", async () => {
    vi.mocked(getPullRequestComments)
      .mockResolvedValueOnce(respond([THREAD("t1", [COMMENT({})])]))
      .mockResolvedValue(
        respond([
          THREAD("t1", [
            COMMENT({}),
            COMMENT({ id: "c2", body: "Fixed in the next push" }),
          ]),
        ]),
      );
    renderDiscussion();

    fireEvent.click(await screen.findByRole("button", { name: "Balas" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Tulis balasan…" }), {
      target: { value: "Fixed in the next push" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Balas" }));

    await waitFor(() =>
      expect(createPullRequestComment).toHaveBeenCalledWith(
        "org_1",
        "repo_1",
        "pr_1",
        { body: "Fixed in the next push", parentId: "t1" },
      ),
    );
    const reply = await screen.findByText("Fixed in the next push");
    const thread = reply.closest("div.border-b") as HTMLElement;
    expect(within(thread).getByText("Looks good")).toBeInTheDocument();
  });

  it("marks provider comments with @username, icon, edits and deletions", async () => {
    vi.mocked(getPullRequestComments).mockResolvedValue(
      respond([
        THREAD("t1", [
          COMMENT({
            origin: "github",
            author: {
              name: "ilhamdhiya01",
              avatarUrl: null,
              critiqUserId: null,
              providerUsername: "ilhamdhiya01",
            },
            editedAt: "2026-10-12T04:00:00Z",
            sync: null,
          }),
          COMMENT({ id: "c2", origin: "github", deleted: true, sync: null }),
        ]),
      ]),
    );
    renderDiscussion();

    expect(await screen.findByText("@ilhamdhiya01")).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: "GitHub" })).toHaveLength(2);
    expect(screen.getByText("(edited)")).toBeInTheDocument();
    expect(screen.getByText("Comment deleted on GitHub")).toBeInTheDocument();
  });

  it("polls while a comment is still being sent", async () => {
    vi.mocked(getPullRequestComments)
      .mockResolvedValueOnce(
        respond([
          THREAD("t1", [COMMENT({ sync: { status: "pending", error: null } })]),
        ]),
      )
      .mockResolvedValue(respond([THREAD("t1", [COMMENT({})])]));
    renderDiscussion();

    expect(await screen.findByText("Sending to GitHub…")).toBeInTheDocument();
    await waitFor(
      () =>
        expect(
          screen.queryByText("Sending to GitHub…"),
        ).not.toBeInTheDocument(),
      { timeout: 7000 },
    );
    expect(getPullRequestComments).toHaveBeenCalledTimes(2);
  });

  it("explains a failed sync and retries it", async () => {
    vi.mocked(retryCommentSync).mockResolvedValue({ data: COMMENT({}) });
    vi.mocked(getPullRequestComments).mockResolvedValue(
      respond([
        THREAD("t1", [
          COMMENT({
            sync: { status: "failed", error: "insufficient_permission" },
          }),
        ]),
      ]),
    );
    renderDiscussion();

    expect(
      await screen.findByText(/Critiq can't comment on GitHub/),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() =>
      expect(retryCommentSync).toHaveBeenCalledWith(
        "org_1",
        "repo_1",
        "pr_1",
        "c1",
      ),
    );
  });

  it("lets Viewers read but not write", async () => {
    vi.mocked(getPullRequestComments).mockResolvedValue(
      respond([THREAD("t1", [COMMENT({})])]),
    );
    renderDiscussion({ ...SCOPE, canComment: false });

    expect(await screen.findByText("Looks good")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Balas" }),
    ).not.toBeInTheDocument();
  });
});
