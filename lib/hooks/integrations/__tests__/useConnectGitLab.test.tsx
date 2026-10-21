import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GITLAB_ERROR_MESSAGE } from "@/const/integration.constant";
import { toast } from "@/lib/toast";
import type { Integration } from "@/lib/types/integration.types";
import { verifyGitLabToken } from "@/services/integrations.service";

import { integrationKeys } from "../queryKeys";
import { useConnectGitLab } from "../useConnectGitLab";

vi.mock("@/services/integrations.service", () => ({
  verifyGitLabToken: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const INPUT = { instanceUrl: "https://gitlab.com", token: "glpat-secret" };

const setup = (cached?: Integration[]) => {
  const client = new QueryClient();
  if (cached)
    client.setQueryData(integrationKeys.list("org_1"), { data: cached });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useConnectGitLab("org_1"), { wrapper });
  const invalidatedKeys = () =>
    invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { client, result, invalidatedKeys };
};

const httpError = (status: number, errors: object[] = [], message = "boom") =>
  Object.assign(new Error(message), {
    response: { status, data: { errors } },
  });

describe("useConnectGitLab", () => {
  afterEach(() => vi.clearAllMocks());

  it("adds GitLab to the cached list and reports success", async () => {
    const gitlab = { source: "GITLAB", state: "ACTIVE" } as Integration;
    vi.mocked(verifyGitLabToken).mockResolvedValue({ data: gitlab } as never);
    const { client, result, invalidatedKeys } = setup([]);

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.handleConnectGitLab(INPUT);
    });

    expect(ok).toBe(true);
    expect(verifyGitLabToken).toHaveBeenCalledWith("org_1", INPUT);
    expect(client.getQueryData(integrationKeys.list("org_1"))).toEqual({
      data: [gitlab],
    });
    expect(invalidatedKeys()).toContainEqual(
      integrationKeys.candidates("org_1", "gitlab"),
    );
    expect(toast.success).toHaveBeenCalledWith("GitLab connected");
  });

  it("shows field errors on the form and returns false", async () => {
    vi.mocked(verifyGitLabToken).mockRejectedValue(
      httpError(422, [
        { field: "token", message: "token_invalid" },
        { field: "unrelated", message: "ignored" },
      ]),
    );
    const { result } = setup();

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.handleConnectGitLab(INPUT);
    });

    expect(ok).toBe(false);
    expect(result.current.connectFieldErrors).toEqual({
      token: GITLAB_ERROR_MESSAGE.token_invalid,
    });
    expect(toast.error).not.toHaveBeenCalled();

    act(() => result.current.clearConnectFieldErrors());
    expect(result.current.connectFieldErrors).toEqual({});
  });

  it("toasts errors that name no form field", async () => {
    vi.mocked(verifyGitLabToken).mockRejectedValue(
      httpError(502, [], "provider_unreachable"),
    );
    const { result } = setup();

    await act(() => result.current.handleConnectGitLab(INPUT));

    expect(toast.error).toHaveBeenCalledWith(
      GITLAB_ERROR_MESSAGE.provider_unreachable,
    );
    expect(result.current.connectFieldErrors).toEqual({});
  });
});
