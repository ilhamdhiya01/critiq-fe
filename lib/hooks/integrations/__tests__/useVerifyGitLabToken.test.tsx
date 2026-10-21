import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { verifyGitLabToken } from "@/services/integrations.service";

import { integrationKeys } from "../queryKeys";
import { useVerifyGitLabToken } from "../useVerifyGitLabToken";

vi.mock("@/services/integrations.service", () => ({
  verifyGitLabToken: vi.fn(),
}));

const INPUT = { instanceUrl: "https://gitlab.com", token: "glpat-secret" };

const setup = () => {
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useVerifyGitLabToken("org_1"), {
    wrapper,
  });
  const invalidatedKeys = () =>
    invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { result, invalidatedKeys };
};

describe("useVerifyGitLabToken", () => {
  afterEach(() => vi.mocked(verifyGitLabToken).mockReset());

  it("refreshes the GitLab candidates once the token is accepted", async () => {
    vi.mocked(verifyGitLabToken).mockResolvedValue({ data: {} } as never);
    const { result, invalidatedKeys } = setup();

    await act(() => result.current.handleVerifyGitLabToken(INPUT));

    expect(verifyGitLabToken).toHaveBeenCalledWith("org_1", INPUT);
    expect(invalidatedKeys()).toContainEqual(
      integrationKeys.candidates("org_1", "gitlab"),
    );
    expect(result.current.verifyFieldErrors).toEqual([]);
  });

  it("exposes the BE's field errors", async () => {
    const errors = [{ field: "token", message: "scope_missing" }];
    vi.mocked(verifyGitLabToken).mockRejectedValue(
      Object.assign(new Error("Request failed"), {
        response: { status: 422, data: { errors } },
      }),
    );
    const { result, invalidatedKeys } = setup();

    await act(() =>
      expect(result.current.handleVerifyGitLabToken(INPUT)).rejects.toThrow(),
    );

    await waitFor(() =>
      expect(result.current.verifyFieldErrors).toEqual(errors),
    );
    expect(invalidatedKeys()).toHaveLength(0);
  });
});
