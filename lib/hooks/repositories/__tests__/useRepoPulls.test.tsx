import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { pullRequestKeys } from "@/lib/hooks/pull-requests/queryKeys";
import { getRepoPulls } from "@/services/repositories.service";

import { repositoryKeys } from "../queryKeys";
import { useRepoPulls } from "../useRepoPulls";

vi.mock("@/services/repositories.service", () => ({
  getRepoPulls: vi.fn(),
}));

const pull = (id: string, scanning: boolean) => ({
  id,
  activeScan: scanning ? { id: `scan_${id}` } : null,
});

const setup = (repoId = "repo_1") => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useRepoPulls("org_1", repoId), {
    wrapper,
  });
  const invalidatedKeys = () =>
    invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { result, invalidatedKeys };
};

describe("useRepoPulls", () => {
  afterEach(() => vi.mocked(getRepoPulls).mockReset());

  it("waits until the repo is known", () => {
    setup("");

    expect(getRepoPulls).not.toHaveBeenCalled();
  });

  it("returns the repo's pulls without polling when nothing scans", async () => {
    vi.mocked(getRepoPulls).mockResolvedValue({
      data: [pull("pr_1", false)],
    } as never);

    const { result, invalidatedKeys } = setup();

    await waitFor(() =>
      expect(result.current.data).toEqual([pull("pr_1", false)]),
    );
    expect(getRepoPulls).toHaveBeenCalledWith("org_1", "repo_1");
    expect(invalidatedKeys()).toHaveLength(0);
  });

  it("polls while a scan runs and refreshes what depends on it once done", async () => {
    vi.mocked(getRepoPulls)
      .mockResolvedValueOnce({
        data: [pull("pr_1", true), pull("pr_2", false)],
      } as never)
      .mockResolvedValue({
        data: [pull("pr_1", false), pull("pr_2", false)],
      } as never);

    const { result, invalidatedKeys } = setup();

    await waitFor(
      () => expect(result.current.data?.[0].activeScan).toBeNull(),
      { timeout: 6000 },
    );
    expect(invalidatedKeys()).toEqual(
      expect.arrayContaining([
        pullRequestKeys.detail("org_1", "repo_1", "pr_1"),
        pullRequestKeys.summary("org_1", "repo_1", "pr_1"),
        repositoryKeys.repoScans("org_1", "repo_1"),
        repositoryKeys.org("org_1"),
        pullRequestKeys.list("org_1"),
      ]),
    );
    // Only the PR whose scan finished is refreshed.
    expect(invalidatedKeys()).not.toContainEqual(
      pullRequestKeys.detail("org_1", "repo_1", "pr_2"),
    );
  });
});
