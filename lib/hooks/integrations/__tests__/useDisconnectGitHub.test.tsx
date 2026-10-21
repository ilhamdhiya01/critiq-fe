import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  GITHUB_UNREACHABLE_MESSAGE,
  INTEGRATION_FORBIDDEN_MESSAGE,
} from "@/const/integration.constant";
import { pullRequestKeys } from "@/lib/hooks/pull-requests/queryKeys";
import { repositoryKeys } from "@/lib/hooks/repositories/queryKeys";
import { toast } from "@/lib/toast";
import { disconnectGitHub } from "@/services/integrations.service";

import { integrationKeys } from "../queryKeys";
import { useDisconnectGitHub } from "../useDisconnectGitHub";

vi.mock("@/services/integrations.service", () => ({
  disconnectGitHub: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const REMOVAL_KEYS = [
  integrationKeys.all,
  repositoryKeys.org("org_1"),
  repositoryKeys.lists(),
  pullRequestKeys.all,
];

const setup = () => {
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useDisconnectGitHub("org_1"), {
    wrapper,
  });
  const invalidatedKeys = () =>
    invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { result, invalidatedKeys };
};

const httpError = (status: number, message = "boom") =>
  Object.assign(new Error(message), { response: { status, data: {} } });

describe("useDisconnectGitHub", () => {
  afterEach(() => vi.clearAllMocks());

  it("refetches everything the removal touched", async () => {
    vi.mocked(disconnectGitHub).mockResolvedValue({ data: null });
    const { result, invalidatedKeys } = setup();

    await act(() => result.current.handleDisconnectGitHub());

    expect(invalidatedKeys()).toEqual(expect.arrayContaining(REMOVAL_KEYS));
    expect(toast.success).toHaveBeenCalledWith("GitHub disconnected");
  });

  it("treats an already-removed integration (404) as done, silently", async () => {
    vi.mocked(disconnectGitHub).mockRejectedValue(httpError(404));
    const { result, invalidatedKeys } = setup();

    await act(() =>
      expect(result.current.handleDisconnectGitHub()).rejects.toThrow(),
    );

    expect(invalidatedKeys()).toEqual(expect.arrayContaining(REMOVAL_KEYS));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("explains that nothing was removed when GitHub is unreachable", async () => {
    vi.mocked(disconnectGitHub).mockRejectedValue(httpError(502));
    const { result, invalidatedKeys } = setup();

    await act(() =>
      expect(result.current.handleDisconnectGitHub()).rejects.toThrow(),
    );

    expect(toast.error).toHaveBeenCalledWith(GITHUB_UNREACHABLE_MESSAGE);
    expect(invalidatedKeys()).toHaveLength(0);
  });

  it("explains a forbidden disconnect", async () => {
    vi.mocked(disconnectGitHub).mockRejectedValue(httpError(403));
    const { result } = setup();

    await act(() =>
      expect(result.current.handleDisconnectGitHub()).rejects.toThrow(),
    );

    expect(toast.error).toHaveBeenCalledWith(INTEGRATION_FORBIDDEN_MESSAGE);
  });
});
