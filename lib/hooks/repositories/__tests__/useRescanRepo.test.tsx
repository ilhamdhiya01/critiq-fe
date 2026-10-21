import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { toast } from "@/lib/toast";
import { rescanRepo } from "@/services/repositories.service";

import { repositoryKeys } from "../queryKeys";
import { useRescanRepo } from "../useRescanRepo";

vi.mock("@/services/repositories.service", () => ({
  rescanRepo: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const setup = () => {
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useRescanRepo("org_1", "repo_1"), {
    wrapper,
  });
  const invalidatedKeys = () =>
    invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { result, invalidatedKeys };
};

const httpError = (status: number, message = "boom") =>
  Object.assign(new Error(message), { response: { status, data: {} } });

describe("useRescanRepo", () => {
  afterEach(() => vi.clearAllMocks());

  it("starts the re-scan and refetches pulls, scans and repos", async () => {
    vi.mocked(rescanRepo).mockResolvedValue({ data: {} } as never);
    const { result, invalidatedKeys } = setup();

    act(() => result.current.handleRescan());

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Re-scan started for open pull requests",
      ),
    );
    expect(rescanRepo).toHaveBeenCalledWith("org_1", "repo_1");
    expect(invalidatedKeys()).toEqual(
      expect.arrayContaining([
        repositoryKeys.pulls("org_1", "repo_1"),
        repositoryKeys.repoScans("org_1", "repo_1"),
        repositoryKeys.org("org_1"),
      ]),
    );
  });

  it("explains who may re-scan on 403", async () => {
    vi.mocked(rescanRepo).mockRejectedValue(httpError(403));
    const { result } = setup();

    act(() => result.current.handleRescan());

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Only Admins can re-scan pull requests",
      ),
    );
  });

  it("toasts other failures", async () => {
    vi.mocked(rescanRepo).mockRejectedValue(httpError(500, "Server error"));
    const { result, invalidatedKeys } = setup();

    act(() => result.current.handleRescan());

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Server error"),
    );
    expect(invalidatedKeys()).toHaveLength(0);
  });
});
