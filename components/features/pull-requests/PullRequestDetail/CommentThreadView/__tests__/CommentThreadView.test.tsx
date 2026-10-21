import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  CommentScope,
  CommentThread,
  PullRequestComment,
} from "@/lib/types/pull-request.types";
import { createPullRequestComment } from "@/services/pull-requests.service";

import CommentThreadView from "../CommentThreadView";

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

const COMMENT = (id: string, body: string): PullRequestComment => ({
  id,
  origin: "critiq",
  author: {
    name: `Author ${id}`,
    avatarUrl: null,
    critiqUserId: id,
    providerUsername: null,
  },
  body,
  createdAt: "2026-10-12T03:00:00Z",
  editedAt: null,
  deleted: false,
  sync: { status: "synced", error: null },
});

const THREAD = (comments: PullRequestComment[]): CommentThread => ({
  id: "t1",
  kind: "inline",
  path: "src/a.ts",
  line: 4,
  side: "new",
  headSha: "sha_head",
  outdated: false,
  comments,
});

const renderThread = (thread: CommentThread, scope = SCOPE) =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <CommentThreadView thread={thread} scope={scope} />
    </QueryClientProvider>,
  );

const REPLY_BOX = "Tulis balasan…";

const openReply = () => {
  fireEvent.click(screen.getByRole("button", { name: "Balas" }));
  return screen.getByRole("textbox", { name: REPLY_BOX });
};

describe("CommentThreadView", () => {
  beforeEach(() => {
    vi.mocked(createPullRequestComment).mockReset();
  });

  it("renders nothing for a thread without comments", () => {
    const { container } = renderThread(THREAD([]));

    expect(container).toBeEmptyDOMElement();
  });

  it("shows the root comment followed by its replies", () => {
    renderThread(
      THREAD([
        COMMENT("c1", "Root question"),
        COMMENT("c2", "First reply"),
        COMMENT("c3", "Second reply"),
      ]),
    );

    const bodies = ["Root question", "First reply", "Second reply"].map(
      (text) => screen.getByText(text),
    );
    expect(bodies[0].compareDocumentPosition(bodies[1])).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(bodies[1].compareDocumentPosition(bodies[2])).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("toggles the reply form and closes it on cancel", () => {
    renderThread(THREAD([COMMENT("c1", "Root")]));

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(openReply()).toHaveFocus();

    fireEvent.click(screen.getByRole("button", { name: "Batal" }));

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Balas" })).toBeInTheDocument();
  });

  it("replies with the thread as parent and closes the form", async () => {
    vi.mocked(createPullRequestComment).mockResolvedValue({
      data: COMMENT("c2", "Done"),
    });
    renderThread(THREAD([COMMENT("c1", "Root")]));

    fireEvent.change(openReply(), { target: { value: "  Done  " } });
    fireEvent.click(screen.getByRole("button", { name: "Balas" }));

    await waitFor(() =>
      expect(createPullRequestComment).toHaveBeenCalledWith(
        "org_1",
        "repo_1",
        "pr_1",
        { body: "Done", parentId: "t1" },
      ),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("textbox", { name: REPLY_BOX }),
      ).not.toBeInTheDocument(),
    );
  });

  it("keeps the form open with the error, and clears it on cancel", async () => {
    vi.mocked(createPullRequestComment).mockRejectedValue(
      Object.assign(new Error("Forbidden"), {
        response: { status: 403, data: { message: "Forbidden" } },
      }),
    );
    renderThread(THREAD([COMMENT("c1", "Root")]));

    fireEvent.change(openReply(), { target: { value: "My reply" } });
    fireEvent.click(screen.getByRole("button", { name: "Balas" }));

    expect(
      await screen.findByText("Only Admins and Reviewers can comment."),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: REPLY_BOX })).toHaveValue(
      "My reply",
    );

    fireEvent.click(screen.getByRole("button", { name: "Batal" }));
    openReply();
    expect(
      screen.queryByText("Only Admins and Reviewers can comment."),
    ).not.toBeInTheDocument();
  });

  it("is read-only for Viewers", () => {
    renderThread(THREAD([COMMENT("c1", "Root"), COMMENT("c2", "Reply")]), {
      ...SCOPE,
      canComment: false,
    });

    expect(screen.getByText("Reply")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Balas" }),
    ).not.toBeInTheDocument();
  });
});
