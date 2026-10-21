import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { pullRequestKeys } from "@/lib/hooks/pull-requests/queryKeys";
import { toast } from "@/lib/toast";
import type {
  CommentScope,
  PullRequestComment,
} from "@/lib/types/pull-request.types";
import { retryCommentSync } from "@/services/pull-requests.service";

import CommentSyncStatus from "../CommentSyncStatus";

vi.mock("@/services/pull-requests.service", () => ({
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
  providerName: "GitLab",
  canComment: true,
};

type Sync = NonNullable<PullRequestComment["sync"]>;

const renderStatus = (sync: Sync, scope: CommentScope = SCOPE) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const view = render(
    <QueryClientProvider client={client}>
      <CommentSyncStatus commentId="c1" sync={sync} scope={scope} />
    </QueryClientProvider>,
  );
  return { ...view, invalidate };
};

const apiError = (message: string, status = 409) =>
  Object.assign(new Error(message), {
    response: { status, data: { message } },
  });

describe("CommentSyncStatus", () => {
  beforeEach(() => {
    vi.mocked(retryCommentSync).mockReset();
    vi.mocked(toast.error).mockReset();
  });

  it("offers no retry while the comment is still pending", () => {
    renderStatus({ status: "pending", error: null });

    expect(
      screen.queryByRole("button", { name: "Retry" }),
    ).not.toBeInTheDocument();
  });

  it("retries the failed comment and refreshes the thread", async () => {
    vi.mocked(retryCommentSync).mockResolvedValue({
      data: {} as PullRequestComment,
    });
    const { invalidate } = renderStatus({ status: "failed", error: "unknown" });

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() =>
      expect(retryCommentSync).toHaveBeenCalledWith(
        "org_1",
        "repo_1",
        "pr_1",
        "c1",
      ),
    );
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: pullRequestKeys.comments("org_1", "repo_1", "pr_1"),
      }),
    );
  });

  it("just refreshes when the comment was already synced elsewhere", async () => {
    vi.mocked(retryCommentSync).mockRejectedValue(apiError("already_synced"));
    const { invalidate } = renderStatus({ status: "failed", error: "unknown" });

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: pullRequestKeys.comments("org_1", "repo_1", "pr_1"),
      }),
    );
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("toasts any other retry error", async () => {
    vi.mocked(retryCommentSync).mockRejectedValue(
      apiError("Provider is down", 502),
    );
    renderStatus({ status: "failed", error: "unknown" });

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Provider is down"),
    );
  });

  it("offers no retry to Viewers", () => {
    renderStatus(
      { status: "failed", error: "insufficient_permission" },
      { ...SCOPE, canComment: false },
    );

    expect(
      screen.queryByRole("button", { name: "Retry" }),
    ).not.toBeInTheDocument();
  });
});
