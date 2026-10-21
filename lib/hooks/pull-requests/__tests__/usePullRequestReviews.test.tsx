import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getPullRequestReviews } from "@/services/pull-requests.service";

import { usePullRequestReviews } from "../usePullRequestReviews";

vi.mock("@/services/pull-requests.service", () => ({
  getPullRequestReviews: vi.fn(),
}));

const review = (id: string, status: "pending" | "synced") => ({
  id,
  sync: { status, error: null },
});

const setup = (id = "pr_1") => {
  const client = new QueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(
    () => usePullRequestReviews("org_1", "repo_1", id),
    { wrapper },
  );
  return { result };
};

const httpError = (status: number) =>
  Object.assign(new Error("Request failed"), {
    response: { status, data: {} },
  });

describe("usePullRequestReviews", () => {
  afterEach(() => vi.mocked(getPullRequestReviews).mockReset());

  it("waits until every id is known", () => {
    setup("");

    expect(getPullRequestReviews).not.toHaveBeenCalled();
  });

  it("returns the review history", async () => {
    const reviews = [review("r_1", "synced")];
    vi.mocked(getPullRequestReviews).mockResolvedValue({
      data: reviews,
    } as never);

    const { result } = setup();

    await waitFor(() => expect(result.current.data).toEqual(reviews));
    expect(result.current.isUnavailable).toBe(false);
  });

  it("hides the history when the endpoint does not exist (404)", async () => {
    vi.mocked(getPullRequestReviews).mockRejectedValue(httpError(404));

    const { result } = setup();

    await waitFor(() => expect(result.current.isUnavailable).toBe(true));
    expect(getPullRequestReviews).toHaveBeenCalledTimes(1);
  });

  it("does not hide the history for other errors", async () => {
    vi.mocked(getPullRequestReviews).mockRejectedValue(httpError(500));

    const { result } = setup();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.isUnavailable).toBe(false);
  });

  it("polls while a review is syncing, then stops", async () => {
    vi.mocked(getPullRequestReviews)
      .mockResolvedValueOnce({ data: [review("r_1", "pending")] } as never)
      .mockResolvedValue({ data: [review("r_1", "synced")] } as never);

    const { result } = setup();

    await waitFor(
      () => expect(result.current.data?.[0].sync.status).toBe("synced"),
      { timeout: 6000 },
    );
    expect(getPullRequestReviews).toHaveBeenCalledTimes(2);
  });
});
