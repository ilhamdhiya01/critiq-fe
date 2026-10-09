import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import type { PullRequestSummary } from "@/lib/types/pull-request.types";
import { getPullRequestSummary } from "@/services/pull-requests.service";

import { usePullRequestSummary } from "../usePullRequestSummary";

vi.mock("@/services/pull-requests.service", () => ({
  getPullRequestSummary: vi.fn(),
}));

const summaryWith = (
  aiStatus: PullRequestSummary["aiStatus"],
): { data: PullRequestSummary } => ({
  data: {
    scanId: "scan_1",
    aiStatus,
    summaryMd: aiStatus === "done" ? "Looks good." : null,
    riskLevel: null,
    provider: null,
    model: null,
    generatedAt: null,
    cached: false,
    filesOmitted: [],
    tokens: null,
    error: null,
  },
});

describe("usePullRequestSummary", () => {
  it("keeps polling while queued/running and stops at done", async () => {
    vi.mocked(getPullRequestSummary)
      .mockResolvedValueOnce(summaryWith("queued"))
      .mockResolvedValueOnce(summaryWith("done"));

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () => usePullRequestSummary("org_1", "repo_1", "pr_1"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.data?.aiStatus).toBe("queued"));
    await waitFor(() => expect(result.current.data?.aiStatus).toBe("done"), {
      timeout: 5000,
    });
    expect(getPullRequestSummary).toHaveBeenCalledTimes(2);
  }, 10_000);
});
