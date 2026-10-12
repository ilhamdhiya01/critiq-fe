import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import type { PullRequestDetail } from "@/lib/types/pull-request.types";
import { getPullRequestDetail } from "@/services/pull-requests.service";

import { usePullRequestDetail } from "../usePullRequestDetail";

vi.mock("@/services/pull-requests.service", () => ({
  getPullRequestDetail: vi.fn(),
}));

const withSync = (status: "pending" | "synced") =>
  ({
    data: {
      id: "pr_1",
      activeScan: null,
      latestReview: { sync: { status, error: null, syncedAt: null } },
    } as unknown as PullRequestDetail,
  }) as Awaited<ReturnType<typeof getPullRequestDetail>>;

const SyncProbe = () => {
  const { data } = usePullRequestDetail("org_1", "repo_1", "pr_1");
  return <span>{data?.latestReview?.sync.status ?? "loading"}</span>;
};

describe("usePullRequestDetail", { timeout: 15_000 }, () => {
  it("polls while the latest review is syncing, then stops", async () => {
    vi.mocked(getPullRequestDetail)
      .mockResolvedValueOnce(withSync("pending"))
      .mockResolvedValue(withSync("synced"));

    render(
      <QueryClientProvider client={new QueryClient()}>
        <SyncProbe />
      </QueryClientProvider>,
    );

    expect(await screen.findByText("pending")).toBeInTheDocument();
    await waitFor(
      () => expect(screen.getByText("synced")).toBeInTheDocument(),
      {
        timeout: 6000,
      },
    );
    expect(getPullRequestDetail).toHaveBeenCalledTimes(2);
  });
});
