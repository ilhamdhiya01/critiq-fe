import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getRepoScans } from "@/services/repositories.service";

import { useRepoScans } from "../useRepoScans";

vi.mock("@/services/repositories.service", () => ({
  getRepoScans: vi.fn(),
}));

const scan = (status: string, aiStatus: string | null = null) => ({
  id: "scan_1",
  status,
  aiStatus,
});

const setup = (repoId = "repo_1") => {
  const client = new QueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useRepoScans("org_1", repoId), {
    wrapper,
  });
  return { result };
};

const httpError = (status: number) =>
  Object.assign(new Error("Request failed"), {
    response: { status, data: {} },
  });

describe("useRepoScans", () => {
  afterEach(() => vi.mocked(getRepoScans).mockReset());

  it("waits until the repo is known", () => {
    setup("");

    expect(getRepoScans).not.toHaveBeenCalled();
  });

  it("hides the section when the endpoint does not exist (404)", async () => {
    vi.mocked(getRepoScans).mockRejectedValue(httpError(404));

    const { result } = setup();

    await waitFor(() => expect(result.current.isUnavailable).toBe(true));
    expect(getRepoScans).toHaveBeenCalledTimes(1);
  });

  it("does not hide the section for other errors", async () => {
    vi.mocked(getRepoScans).mockRejectedValue(httpError(500));

    const { result } = setup();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.isUnavailable).toBe(false);
  });

  it("polls while a scan is running, then stops", async () => {
    vi.mocked(getRepoScans)
      .mockResolvedValueOnce({ data: [scan("RUNNING")] } as never)
      .mockResolvedValue({ data: [scan("DONE")] } as never);

    const { result } = setup();

    await waitFor(() => expect(result.current.data?.[0].status).toBe("DONE"), {
      timeout: 6000,
    });
    expect(getRepoScans).toHaveBeenCalledTimes(2);
    expect(result.current.isUnavailable).toBe(false);
  });

  it("keeps polling while the AI review runs after the static scan is done", async () => {
    vi.mocked(getRepoScans)
      .mockResolvedValueOnce({ data: [scan("DONE", "running")] } as never)
      .mockResolvedValue({ data: [scan("DONE", "done")] } as never);

    const { result } = setup();

    await waitFor(
      () => expect(result.current.data?.[0].aiStatus).toBe("done"),
      { timeout: 6000 },
    );
    expect(getRepoScans).toHaveBeenCalledTimes(2);
  });
});
