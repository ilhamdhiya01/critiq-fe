import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AxiosError, type AxiosResponse } from "axios";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Role } from "@/lib/types/auth.types";
import type {
  MergeBlocker,
  PullRequestDetail,
} from "@/lib/types/pull-request.types";
import { mergePullRequest } from "@/services/pull-requests.service";

import MergeControl from "../MergeControl";

vi.mock("@/services/pull-requests.service", () => ({
  mergePullRequest: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const detailWith = (allowed: boolean, blockers: MergeBlocker[] = []) =>
  ({
    id: "pr_1",
    repositoryId: "repo_1",
    provider: "GITHUB",
    externalId: "2",
    state: "OPEN",
    sourceBranch: "fit",
    targetBranch: "dev",
    headSha: "sha_head",
    latestScan: { criticalCount: 3 },
    merge: { allowed, blockers },
  }) as unknown as PullRequestDetail;

const renderControl = (
  detail: PullRequestDetail,
  role: Role = "ADMIN",
  client = new QueryClient(),
) =>
  render(
    <QueryClientProvider client={client}>
      <MergeControl
        orgId="org_1"
        detail={detail}
        role={role}
        providerName="GitHub"
      />
    </QueryClientProvider>,
  );

const axiosError = (status: number, data: object) =>
  new AxiosError("x", "ERR", undefined, undefined, {
    status,
    data,
  } as AxiosResponse);

describe("MergeControl", { timeout: 15_000 }, () => {
  beforeEach(() => {
    vi.mocked(mergePullRequest).mockReset();
    vi.mocked(mergePullRequest).mockResolvedValue({
      data: {
        state: "merged",
        method: "squash",
        headSha: "sha_head",
        mergedAt: "2026-10-12T05:00:00Z",
      },
    });
  });

  it("merges with the chosen method and branch option", async () => {
    renderControl(detailWith(true));

    fireEvent.click(screen.getByRole("button", { name: /^Merge$/ }));
    expect(
      screen.getByText(/into/).textContent?.replace(/\s+/g, " "),
    ).toContain("Merge #2 into dev on GitHub as Critiq");

    fireEvent.click(screen.getByRole("radio", { name: "Squash" }));
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(
      screen
        .getAllByRole("button", { name: "Merge" })
        .find((button) => button.closest("[role=dialog]")) as HTMLElement,
    );

    await waitFor(() =>
      expect(mergePullRequest).toHaveBeenCalledWith("org_1", "repo_1", "pr_1", {
        headSha: "sha_head",
        method: "squash",
        deleteSourceBranch: true,
      }),
    );
  });

  it.each([
    ["approval_required", "Needs an approval on the latest commit"],
    ["changes_requested", "Changes were requested on the latest commit"],
    ["scan_required", "Waiting for the scan of the latest commit"],
    ["critical_findings", "3 critical findings must be resolved"],
  ] as const)("%s → disabled with its reason", (blocker, reason) => {
    renderControl(detailWith(false, [blocker]), "REVIEWER");

    expect(screen.getByRole("button", { name: /^Merge$/ })).toBeDisabled();
    expect(screen.getByText(reason)).toBeInTheDocument();
  });

  it("hides the button once the PR is no longer open", () => {
    renderControl(detailWith(false, ["pull_not_open"]));

    expect(screen.queryByRole("button", { name: /Merge/ })).toBeNull();
  });

  it("lets an Admin merge anyway over critical findings, with a reason", async () => {
    renderControl(detailWith(false, ["critical_findings"]), "ADMIN");

    fireEvent.click(screen.getByRole("button", { name: "Merge anyway…" }));
    const confirm = screen.getByRole("button", { name: "Merge anyway" });
    expect(confirm).toBeDisabled();

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "False positive — test fixture key." },
    });
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);

    await waitFor(() =>
      expect(mergePullRequest).toHaveBeenCalledWith("org_1", "repo_1", "pr_1", {
        headSha: "sha_head",
        method: "merge",
        deleteSourceBranch: false,
        overrideCritical: { reason: "False positive — test fixture key." },
      }),
    );
  });

  it("never offers the override to Reviewers", () => {
    renderControl(detailWith(false, ["critical_findings"]), "REVIEWER");

    expect(screen.queryByRole("button", { name: "Merge anyway…" })).toBeNull();
  });

  it("offers no override while other blockers remain", () => {
    renderControl(
      detailWith(false, ["approval_required", "critical_findings"]),
      "ADMIN",
    );

    expect(screen.queryByRole("button", { name: "Merge anyway…" })).toBeNull();
  });

  it("shows the provider's explanation for not_mergeable", async () => {
    vi.mocked(mergePullRequest).mockRejectedValue(
      axiosError(422, {
        message: "not_mergeable",
        detail: "Merge conflict in src/a.ts",
      }),
    );
    renderControl(detailWith(true));

    fireEvent.click(screen.getByRole("button", { name: /^Merge$/ }));
    fireEvent.click(
      screen
        .getAllByRole("button", { name: "Merge" })
        .find((button) => button.closest("[role=dialog]")) as HTMLElement,
    );

    expect(
      await screen.findByText("Merge conflict in src/a.ts"),
    ).toBeInTheDocument();
  });

  it("409 head_changed refetches the PR and explains why", async () => {
    vi.mocked(mergePullRequest).mockRejectedValue(
      axiosError(409, { message: "head_changed" }),
    );
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    renderControl(detailWith(true), "ADMIN", client);

    fireEvent.click(screen.getByRole("button", { name: /^Merge$/ }));
    fireEvent.click(
      screen
        .getAllByRole("button", { name: "Merge" })
        .find((button) => button.closest("[role=dialog]")) as HTMLElement,
    );

    expect(
      await screen.findByText(/got new commits — the page was refreshed/),
    ).toBeInTheDocument();
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["pull-requests", "detail", "org_1", "repo_1", "pr_1"],
    });
  });
});
