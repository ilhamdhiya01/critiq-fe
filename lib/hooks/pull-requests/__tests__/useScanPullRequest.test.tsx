import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { repositoryKeys } from "@/lib/hooks/repositories/queryKeys";
import { toast } from "@/lib/toast";
import { scanPullRequest } from "@/services/pull-requests.service";

import { pullRequestKeys } from "../queryKeys";
import { useScanPullRequest } from "../useScanPullRequest";

vi.mock("@/services/pull-requests.service", () => ({
  scanPullRequest: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const PR = ["org_1", "repo_1", "pr_1"] as const;

const setup = () => {
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useScanPullRequest(...PR), { wrapper });
  const invalidatedKeys = () =>
    invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { result, invalidatedKeys };
};

const rejectWith = (status: number, data: object, message = "boom") =>
  vi
    .mocked(scanPullRequest)
    .mockRejectedValue(
      Object.assign(new Error(message), { response: { status, data } }),
    );

describe("useScanPullRequest", () => {
  afterEach(() => vi.clearAllMocks());

  it("starts the scan and refetches everything that shows it", async () => {
    vi.mocked(scanPullRequest).mockResolvedValue({ data: {} } as never);
    const { result, invalidatedKeys } = setup();

    await act(() => result.current.handleScanNow());

    expect(scanPullRequest).toHaveBeenCalledWith(...PR);
    expect(toast.success).toHaveBeenCalledWith("Scan started");
    expect(invalidatedKeys()).toEqual(
      expect.arrayContaining([
        pullRequestKeys.detail(...PR),
        pullRequestKeys.summary(...PR),
        pullRequestKeys.list("org_1"),
        repositoryKeys.pulls("org_1", "repo_1"),
      ]),
    );
  });

  it("explains who may scan on 403", async () => {
    rejectWith(403, { message: "forbidden" });
    const { result } = setup();

    await act(() => expect(result.current.handleScanNow()).rejects.toThrow());

    expect(toast.error).toHaveBeenCalledWith(
      "Only Admins and Reviewers can scan pull requests",
    );
  });

  it("falls back to the BE message, then the error message", async () => {
    rejectWith(409, { message: "Scan already running" });
    const { result } = setup();

    await act(() => expect(result.current.handleScanNow()).rejects.toThrow());
    expect(toast.error).toHaveBeenLastCalledWith("Scan already running");

    rejectWith(500, {}, "Network Error");
    await act(() => expect(result.current.handleScanNow()).rejects.toThrow());
    expect(toast.error).toHaveBeenLastCalledWith("Network Error");
  });
});
