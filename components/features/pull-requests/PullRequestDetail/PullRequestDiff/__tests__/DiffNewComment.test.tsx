import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { pullRequestKeys } from "@/lib/hooks/pull-requests/queryKeys";
import type {
  CommentScope,
  PullRequestComment,
} from "@/lib/types/pull-request.types";
import { createPullRequestComment } from "@/services/pull-requests.service";

import DiffNewComment from "../DiffNewComment";

vi.mock("@/services/pull-requests.service", () => ({
  createPullRequestComment: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const SCOPE: CommentScope = {
  orgId: "org_1",
  repoId: "repo_1",
  pullId: "pr_1",
  headSha: "sha_scope",
  providerName: "GitHub",
  canComment: true,
};

const PLACEHOLDER = "Komentari src/old.ts:7…";

const renderComposer = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const onDone = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <DiffNewComment
        path="src/old.ts"
        side="old"
        line={7}
        headSha="sha_line"
        scope={SCOPE}
        onDone={onDone}
      />
    </QueryClientProvider>,
  );
  return { onDone, invalidate };
};

const write = (value: string) => {
  fireEvent.change(screen.getByRole("textbox", { name: PLACEHOLDER }), {
    target: { value },
  });
  fireEvent.click(screen.getByRole("button", { name: "Komentar" }));
};

describe("DiffNewComment", () => {
  beforeEach(() => {
    vi.mocked(createPullRequestComment).mockReset();
  });

  it("creates an inline comment on the line's path, side, line and head", async () => {
    vi.mocked(createPullRequestComment).mockResolvedValue({
      data: {} as PullRequestComment,
    });
    const { onDone, invalidate } = renderComposer();

    write("  Old call leaks  ");

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(createPullRequestComment).toHaveBeenCalledWith(
      "org_1",
      "repo_1",
      "pr_1",
      {
        body: "Old call leaks",
        inline: {
          path: "src/old.ts",
          line: 7,
          side: "old",
          headSha: "sha_line",
        },
      },
    );
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: pullRequestKeys.comments("org_1", "repo_1", "pr_1"),
    });
  });

  it("stays open with the explanation when the head moved on", async () => {
    vi.mocked(createPullRequestComment).mockRejectedValue(
      Object.assign(new Error("Conflict"), {
        response: { status: 409, data: { message: "head_changed" } },
      }),
    );
    const { onDone, invalidate } = renderComposer();

    write("Too late");

    expect(
      await screen.findByText(/This pull request got new commits/),
    ).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox", { name: PLACEHOLDER })).toHaveValue(
      "Too late",
    );
    // The diff is reloaded so the reviewer comments on current lines.
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: pullRequestKeys.diff("org_1", "repo_1", "pr_1"),
    });
  });

  it("closes without posting on cancel", () => {
    const { onDone } = renderComposer();

    fireEvent.click(screen.getByRole("button", { name: "Batal" }));

    expect(onDone).toHaveBeenCalledTimes(1);
    expect(createPullRequestComment).not.toHaveBeenCalled();
  });
});
