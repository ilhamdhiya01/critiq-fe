import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  REVIEW_APPROVE_BLOCKED_REASON,
  REVIEW_BODY_MAX,
} from "@/const/pull-request.constant";
import type { PullRequestReview } from "@/lib/types/pull-request.types";
import { submitPullRequestReview } from "@/services/pull-requests.service";

import ReviewPanel from "../ReviewPanel";

vi.mock("@/services/pull-requests.service", () => ({
  submitPullRequestReview: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const REVIEW = (
  overrides: Partial<PullRequestReview> = {},
): PullRequestReview => ({
  id: "rev_1",
  decision: "approve",
  body: null,
  headSha: "sha_head",
  reviewer: { id: "u1", name: "Ilham", avatarUrl: null },
  reviewerRole: "reviewer",
  effectivePolicy: "allow_ai",
  manualConfirmation: false,
  outdated: false,
  sync: { status: "pending", error: null, syncedAt: null },
  createdAt: "2026-10-12T03:00:00Z",
  ...overrides,
});

const renderPanel = (
  props: Partial<React.ComponentProps<typeof ReviewPanel>> = {},
) =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <ReviewPanel
        orgId="org_1"
        repoId="repo_1"
        pullId="pr_1"
        headSha="sha_head"
        requiresBoth={false}
        isConfirmed={false}
        isAiDone={false}
        myReview={null}
        {...props}
      />
    </QueryClientProvider>,
  );

const button = (name: string) => screen.getByRole("button", { name });
const queryButton = (name: string) => screen.queryByRole("button", { name });

const apiError = (status: number, message: string) =>
  Object.assign(new Error(message), {
    response: { status, data: { message } },
  });

describe("ReviewPanel", () => {
  beforeEach(() => {
    vi.mocked(submitPullRequestReview).mockReset();
    vi.mocked(submitPullRequestReview).mockResolvedValue({ data: REVIEW() });
  });

  it("approves the head commit without a body when none is written", async () => {
    renderPanel();

    fireEvent.click(button("Approve"));
    fireEvent.click(button("Submit approval"));

    await waitFor(() =>
      expect(submitPullRequestReview).toHaveBeenCalledWith(
        "org_1",
        "repo_1",
        "pr_1",
        { decision: "approve", headSha: "sha_head" },
      ),
    );
    await waitFor(() => expect(queryButton("Submit approval")).toBeNull());
  });

  it("Require both: blocks Approve until confirmed and the AI is done", () => {
    renderPanel({ requiresBoth: true });

    expect(button("Approve")).toBeDisabled();
    expect(
      screen.getByText(REVIEW_APPROVE_BLOCKED_REASON.confirmation),
    ).toBeInTheDocument();
    expect(
      screen.getByText(REVIEW_APPROVE_BLOCKED_REASON.aiAnalysis),
    ).toBeInTheDocument();
    // Requesting changes is never blocked by the policy.
    expect(button("Request changes")).toBeEnabled();
  });

  it("Require both: lists only the blocker that remains", () => {
    renderPanel({ requiresBoth: true, isConfirmed: true });

    expect(button("Approve")).toBeDisabled();
    expect(
      screen.queryByText(REVIEW_APPROVE_BLOCKED_REASON.confirmation),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(REVIEW_APPROVE_BLOCKED_REASON.aiAnalysis),
    ).toBeInTheDocument();
  });

  it("Require both: sends the manual confirmation and the trimmed body", async () => {
    renderPanel({ requiresBoth: true, isConfirmed: true, isAiDone: true });

    fireEvent.click(button("Approve"));
    fireEvent.change(
      screen.getByRole("textbox", { name: "Comment (optional)" }),
      { target: { value: "  LGTM  " } },
    );
    fireEvent.click(button("Submit approval"));

    await waitFor(() =>
      expect(submitPullRequestReview).toHaveBeenCalledWith(
        "org_1",
        "repo_1",
        "pr_1",
        {
          decision: "approve",
          headSha: "sha_head",
          body: "LGTM",
          manualConfirmation: true,
        },
      ),
    );
  });

  it("requires a reason to request changes", async () => {
    vi.mocked(submitPullRequestReview).mockResolvedValue({
      data: REVIEW({ decision: "request_changes" }),
    });
    renderPanel();

    fireEvent.click(button("Request changes"));
    const reason = screen.getByRole("textbox", {
      name: "What needs to change?",
    });
    expect(reason).toBeRequired();
    expect(button("Request changes")).toBeDisabled();

    fireEvent.change(reason, { target: { value: "   " } });
    expect(button("Request changes")).toBeDisabled();

    fireEvent.change(reason, { target: { value: " Add tests " } });
    fireEvent.click(button("Request changes"));

    await waitFor(() =>
      expect(submitPullRequestReview).toHaveBeenCalledWith(
        "org_1",
        "repo_1",
        "pr_1",
        {
          decision: "request_changes",
          headSha: "sha_head",
          body: "Add tests",
        },
      ),
    );
  });

  it("blocks a body over the limit", () => {
    renderPanel();

    fireEvent.click(button("Approve"));
    fireEvent.change(
      screen.getByRole("textbox", { name: "Comment (optional)" }),
      { target: { value: "a".repeat(REVIEW_BODY_MAX + 1) } },
    );

    expect(button("Submit approval")).toBeDisabled();
  });

  it("cannot review before the head commit is known", () => {
    renderPanel({ headSha: null });

    expect(button("Approve")).toBeDisabled();
    expect(button("Request changes")).toBeDisabled();
  });

  it("cancel discards the draft", () => {
    renderPanel();

    fireEvent.click(button("Request changes"));
    fireEvent.change(
      screen.getByRole("textbox", { name: "What needs to change?" }),
      { target: { value: "Draft" } },
    );
    fireEvent.click(button("Cancel"));

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    fireEvent.click(button("Request changes"));
    expect(
      screen.getByRole("textbox", { name: "What needs to change?" }),
    ).toHaveValue("");
    expect(submitPullRequestReview).not.toHaveBeenCalled();
  });

  it("keeps the draft and shows the error when submitting fails", async () => {
    vi.mocked(submitPullRequestReview).mockRejectedValue(
      apiError(500, "Server exploded"),
    );
    renderPanel();

    fireEvent.click(button("Approve"));
    fireEvent.change(
      screen.getByRole("textbox", { name: "Comment (optional)" }),
      { target: { value: "Nice" } },
    );
    fireEvent.click(button("Submit approval"));

    expect(await screen.findByText("Server exploded")).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Comment (optional)" }),
    ).toHaveValue("Nice");
  });

  it("replaces Approve with my status once I approved this commit", () => {
    renderPanel({
      requiresBoth: true,
      myReview: REVIEW({ decision: "approve" }),
    });

    expect(queryButton("Approve")).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent(
      "You approved this commit",
    );
    // Blockers for a button that is gone would only confuse.
    expect(
      screen.queryByText(REVIEW_APPROVE_BLOCKED_REASON.confirmation),
    ).not.toBeInTheDocument();
    expect(button("Request changes")).toBeEnabled();
  });

  it("disables Request changes once I requested changes on this commit", () => {
    renderPanel({ myReview: REVIEW({ decision: "request_changes" }) });

    expect(button("Request changes")).toBeDisabled();
    expect(button("Approve")).toBeEnabled();
    expect(screen.getByRole("status")).toHaveTextContent(
      "You requested changes on this commit",
    );
  });
});
