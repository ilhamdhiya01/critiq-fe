import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AxiosError, type AxiosResponse } from "axios";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Role } from "@/lib/types/auth.types";
import type {
  AiSummaryStatus,
  PullRequestDetail,
} from "@/lib/types/pull-request.types";
import { getUser } from "@/services/auth.service";
import {
  getPullRequestReviews,
  submitPullRequestReview,
} from "@/services/pull-requests.service";

import ReviewSection from "../ReviewSection";

vi.mock("@/services/pull-requests.service", () => ({
  submitPullRequestReview: vi.fn(),
  getPullRequestReviews: vi.fn(),
}));

vi.mock("@/services/auth.service", () => ({
  getUser: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const DETAIL = {
  id: "pr_1",
  repositoryId: "repo_1",
  provider: "GITHUB",
  state: "OPEN",
  effectivePolicy: "ALLOW_AI",
  headSha: "sha_head",
  latestScan: { headSha: "sha_head", aiStatus: "done" },
} as unknown as PullRequestDetail;

const REVIEW = {
  id: "rev_1",
  decision: "approve",
  body: null,
  headSha: "sha_head",
  reviewer: { id: "u1", name: "Ilham", avatarUrl: null },
  reviewerRole: "admin",
  effectivePolicy: "allow_ai",
  manualConfirmation: false,
  outdated: false,
  sync: { status: "pending", error: null, syncedAt: null },
  createdAt: "2026-10-12T03:00:00Z",
};

const renderSection = (
  {
    detail = DETAIL,
    role = "ADMIN",
    summaryAiStatus,
  }: {
    detail?: PullRequestDetail;
    role?: Role;
    summaryAiStatus?: AiSummaryStatus | null;
  } = {},
  client = new QueryClient(),
) =>
  render(
    <QueryClientProvider client={client}>
      <ReviewSection
        orgId="org_1"
        detail={detail}
        role={role}
        summaryAiStatus={summaryAiStatus}
      />
    </QueryClientProvider>,
  );

describe("ReviewSection", { timeout: 15_000 }, () => {
  beforeEach(() => {
    vi.mocked(submitPullRequestReview).mockReset();
    vi.mocked(submitPullRequestReview).mockResolvedValue({
      data: REVIEW,
    } as never);
    vi.mocked(getPullRequestReviews).mockReset();
    vi.mocked(getPullRequestReviews).mockResolvedValue({ data: [] });
    vi.mocked(getUser).mockResolvedValue({ data: { id: "u1" } } as never);
  });

  it("hides the review actions from Viewers", () => {
    renderSection({ role: "VIEWER" });

    expect(
      screen.queryByRole("button", { name: /Approve/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Request changes/ }),
    ).not.toBeInTheDocument();
  });

  it("never shows Merge to Viewers", () => {
    renderSection({
      role: "VIEWER",
      detail: {
        ...DETAIL,
        merge: { allowed: true, blockers: [] },
      } as PullRequestDetail,
    });

    expect(
      screen.queryByRole("button", { name: /Merge/ }),
    ).not.toBeInTheDocument();
  });

  it("hides Merge when the BE does not send merge info", () => {
    renderSection();

    expect(screen.getByRole("button", { name: /Approve/ })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /Merge/ }),
    ).not.toBeInTheDocument();
  });

  it("shows Merge next to the review actions when allowed", () => {
    renderSection({
      detail: {
        ...DETAIL,
        merge: { allowed: true, blockers: [] },
      } as PullRequestDetail,
    });

    expect(screen.getByRole("button", { name: /^Merge$/ })).toBeEnabled();
  });

  it("hides the panel on a merged PR", () => {
    renderSection({ detail: { ...DETAIL, state: "MERGED" } });

    expect(screen.queryByText("Your review")).not.toBeInTheDocument();
  });

  it("approves with the head commit the reviewer is looking at", async () => {
    renderSection();

    fireEvent.click(screen.getByRole("button", { name: /Approve/ }));
    fireEvent.click(screen.getByRole("button", { name: "Submit approval" }));

    await waitFor(() =>
      expect(submitPullRequestReview).toHaveBeenCalledWith(
        "org_1",
        "repo_1",
        "pr_1",
        { decision: "approve", headSha: "sha_head" },
      ),
    );
  });

  it("Require both: Approve waits for the confirmation and the AI analysis", async () => {
    const requireBoth = {
      ...DETAIL,
      effectivePolicy: "REQUIRE_BOTH",
      latestScan: { headSha: "sha_head", aiStatus: "running" },
    } as unknown as PullRequestDetail;
    const { rerender } = renderSection({ detail: requireBoth });

    const approve = screen.getByRole("button", { name: /Approve/ });
    expect(approve).toBeDisabled();
    expect(screen.getByText("Confirm the manual review above.")).toBeVisible();
    expect(
      screen.getByText("Waiting for the AI analysis of this commit to finish."),
    ).toBeVisible();

    fireEvent.click(
      screen.getByRole("checkbox", { name: "Manual review confirmation" }),
    );
    expect(approve).toBeDisabled();

    // The AI run finished for this commit.
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <ReviewSection
          orgId="org_1"
          detail={requireBoth}
          role="REVIEWER"
          summaryAiStatus="done"
        />
      </QueryClientProvider>,
    );
    const enabled = screen.getByRole("button", { name: /Approve/ });
    expect(enabled).toBeEnabled();

    fireEvent.click(enabled);
    fireEvent.click(screen.getByRole("button", { name: "Submit approval" }));

    await waitFor(() =>
      expect(submitPullRequestReview).toHaveBeenCalledWith(
        "org_1",
        "repo_1",
        "pr_1",
        { decision: "approve", headSha: "sha_head", manualConfirmation: true },
      ),
    );
  });

  it("does not let Request changes go out without a reason", async () => {
    renderSection();

    fireEvent.click(screen.getByRole("button", { name: /Request changes/ }));
    const submit = screen.getByRole("button", { name: "Request changes" });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "   " },
    });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Handle the null token." },
    });
    fireEvent.click(submit);

    await waitFor(() =>
      expect(submitPullRequestReview).toHaveBeenCalledWith(
        "org_1",
        "repo_1",
        "pr_1",
        {
          decision: "request_changes",
          headSha: "sha_head",
          body: "Handle the null token.",
        },
      ),
    );
  });

  it("409 head_changed refetches the PR and explains why", async () => {
    vi.mocked(submitPullRequestReview).mockRejectedValue(
      new AxiosError("head_changed", "ERR", undefined, undefined, {
        status: 409,
        data: { message: "head_changed" },
      } as AxiosResponse),
    );
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    renderSection({}, client);

    fireEvent.click(screen.getByRole("button", { name: /Approve/ }));
    fireEvent.click(screen.getByRole("button", { name: "Submit approval" }));

    expect(
      await screen.findByText(/got new commits since you opened it/),
    ).toBeInTheDocument();
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["pull-requests", "detail", "org_1", "repo_1", "pr_1"],
    });
    // The form stays open so nothing typed is lost.
    expect(
      screen.getByRole("button", { name: "Submit approval" }),
    ).toBeInTheDocument();
  });

  describe("my decision on this commit", () => {
    const mine = (
      decision: "approve" | "request_changes",
      overrides: Record<string, unknown> = {},
    ) => ({
      ...REVIEW,
      id: `rev_${decision}`,
      decision,
      sync: { status: "synced", error: null, syncedAt: null },
      ...overrides,
    });

    it("replaces Approve with a status once I approved this commit", async () => {
      vi.mocked(getPullRequestReviews).mockResolvedValue({
        data: [mine("approve")],
      } as never);
      renderSection();

      expect(
        await screen.findByText("You approved this commit"),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /^Approve$/ }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Request changes/ }),
      ).toBeEnabled();
    });

    it("lets me approve again after I requested changes on the same commit", async () => {
      vi.mocked(getPullRequestReviews).mockResolvedValue({
        data: [mine("request_changes"), mine("approve")],
      } as never);
      renderSection();

      expect(
        await screen.findByText("You requested changes on this commit"),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Approve/ })).toBeEnabled();
      expect(
        screen.getByRole("button", { name: /Request changes/ }),
      ).toBeDisabled();
    });

    it("ignores my review on an older commit", async () => {
      vi.mocked(getPullRequestReviews).mockResolvedValue({
        data: [mine("approve", { headSha: "sha_old", outdated: true })],
      } as never);
      renderSection();

      await waitFor(() => expect(getPullRequestReviews).toHaveBeenCalled());
      expect(screen.getByRole("button", { name: /Approve/ })).toBeEnabled();
      expect(
        screen.getByRole("button", { name: /Request changes/ }),
      ).toBeEnabled();
      expect(
        screen.queryByText("You approved this commit"),
      ).not.toBeInTheDocument();
    });

    it("is not blocked by another reviewer's decision", async () => {
      vi.mocked(getPullRequestReviews).mockResolvedValue({
        data: [
          mine("approve", {
            reviewer: { id: "u2", name: "Rina", avatarUrl: null },
          }),
        ],
      } as never);
      renderSection();

      await waitFor(() => expect(getPullRequestReviews).toHaveBeenCalled());
      expect(screen.getByRole("button", { name: /Approve/ })).toBeEnabled();
      expect(
        screen.queryByText("You approved this commit"),
      ).not.toBeInTheDocument();
    });

    it("shows my approval right after submitting", async () => {
      vi.mocked(submitPullRequestReview).mockResolvedValue({
        data: mine("approve", {
          sync: { status: "pending", error: null, syncedAt: null },
        }),
      } as never);
      // First load: nothing yet; after the submit the BE lists my approval.
      vi.mocked(getPullRequestReviews)
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValue({ data: [mine("approve")] } as never);
      renderSection();
      await waitFor(() => expect(getPullRequestReviews).toHaveBeenCalled());

      fireEvent.click(screen.getByRole("button", { name: /Approve/ }));
      fireEvent.click(screen.getByRole("button", { name: "Submit approval" }));

      expect(
        await screen.findByText("You approved this commit"),
      ).toBeInTheDocument();
    });

    it("409 already_reviewed refetches and explains, without a generic error", async () => {
      vi.mocked(submitPullRequestReview).mockRejectedValue(
        new AxiosError("already_reviewed", "ERR", undefined, undefined, {
          status: 409,
          data: { message: "already_reviewed" },
        } as AxiosResponse),
      );
      renderSection();
      await waitFor(() =>
        expect(getPullRequestReviews).toHaveBeenCalledTimes(1),
      );

      fireEvent.click(screen.getByRole("button", { name: /Approve/ }));
      fireEvent.click(screen.getByRole("button", { name: "Submit approval" }));

      expect(
        await screen.findByText("You already approved this commit."),
      ).toBeInTheDocument();
      await waitFor(() =>
        expect(getPullRequestReviews).toHaveBeenCalledTimes(2),
      );
      expect(screen.queryByText("already_reviewed")).not.toBeInTheDocument();
    });
  });
});
