import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { INTEGRATION_FORBIDDEN_MESSAGE } from "@/const/integration.constant";
import { toast } from "@/lib/toast";
import type { Integration } from "@/lib/types/integration.types";
import { getGitLabHealth } from "@/services/integrations.service";

import { integrationKeys } from "../queryKeys";
import { useCheckGitLabHealth } from "../useCheckGitLabHealth";

vi.mock("@/services/integrations.service", () => ({
  getGitLabHealth: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const integration = (source: "GITHUB" | "GITLAB", state: string) =>
  ({ source, state }) as unknown as Integration;

const setup = (cached?: Integration[]) => {
  const client = new QueryClient();
  if (cached)
    client.setQueryData(integrationKeys.list("org_1"), { data: cached });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useCheckGitLabHealth("org_1"), {
    wrapper,
  });
  const invalidatedKeys = () =>
    invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { client, result, invalidatedKeys };
};

const httpError = (status: number, message = "boom") =>
  Object.assign(new Error(message), { response: { status, data: {} } });

describe("useCheckGitLabHealth", () => {
  afterEach(() => vi.clearAllMocks());

  it("replaces the GitLab row in the cached list and confirms health", async () => {
    const healthy = integration("GITLAB", "ACTIVE");
    vi.mocked(getGitLabHealth).mockResolvedValue({ data: healthy } as never);
    const github = integration("GITHUB", "ACTIVE");
    const { client, result } = setup([
      github,
      integration("GITLAB", "INVALID"),
    ]);

    act(() => result.current.handleCheckGitLabHealth());

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "GitLab connection is healthy",
      ),
    );
    expect(client.getQueryData(integrationKeys.list("org_1"))).toEqual({
      data: [github, healthy],
    });
  });

  it("warns when GitLab is not active", async () => {
    vi.mocked(getGitLabHealth).mockResolvedValue({
      data: integration("GITLAB", "TOKEN_EXPIRED"),
    } as never);
    const { client, result } = setup();

    act(() => result.current.handleCheckGitLabHealth());

    await waitFor(() =>
      expect(toast.warning).toHaveBeenCalledWith(
        "GitLab connection needs attention",
      ),
    );
    // Nothing cached yet, so nothing is created.
    expect(client.getQueryData(integrationKeys.list("org_1"))).toBeUndefined();
  });

  it("resyncs the list when GitLab was disconnected elsewhere", async () => {
    vi.mocked(getGitLabHealth).mockRejectedValue(httpError(404));
    const { result, invalidatedKeys } = setup();

    act(() => result.current.handleCheckGitLabHealth());

    await waitFor(() =>
      expect(toast.info).toHaveBeenCalledWith("GitLab is no longer connected"),
    );
    expect(invalidatedKeys()).toContainEqual(integrationKeys.list("org_1"));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("explains a forbidden check", async () => {
    vi.mocked(getGitLabHealth).mockRejectedValue(httpError(403));
    const { result } = setup();

    act(() => result.current.handleCheckGitLabHealth());

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(INTEGRATION_FORBIDDEN_MESSAGE),
    );
  });
});
