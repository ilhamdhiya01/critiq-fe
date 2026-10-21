import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MEMBER_ERROR_MESSAGE } from "@/const/member.constant";
import { toast } from "@/lib/toast";
import { revokeInvite } from "@/services/members.service";

import { membersKeys } from "../queryKeys";
import { useRevokeInvite } from "../useRevokeInvite";

vi.mock("@/services/members.service", () => ({
  revokeInvite: vi.fn(),
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
  const { result } = renderHook(() => useRevokeInvite("org_1"), { wrapper });
  const invalidatedKeys = () =>
    invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { result, invalidatedKeys };
};

describe("useRevokeInvite", () => {
  afterEach(() => vi.clearAllMocks());

  it("marks the row being revoked, then refetches the members", async () => {
    let resolve: (value: unknown) => void = () => {};
    vi.mocked(revokeInvite).mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }) as never,
    );
    const { result, invalidatedKeys } = setup();

    expect(result.current.revokingId).toBeUndefined();

    act(() => result.current.handleRevoke("inv_1"));

    await waitFor(() => expect(result.current.revokingId).toBe("inv_1"));
    expect(revokeInvite).toHaveBeenCalledWith("org_1", "inv_1");

    await act(async () => resolve({ data: null }));

    await waitFor(() => expect(result.current.revokingId).toBeUndefined());
    expect(toast.success).toHaveBeenCalledWith("Invitation revoked");
    expect(invalidatedKeys()).toContainEqual(membersKeys.org("org_1"));
  });

  it("explains a refused revoke", async () => {
    vi.mocked(revokeInvite).mockRejectedValue(
      Object.assign(new Error("Request failed"), {
        response: { status: 403, data: {} },
      }),
    );
    const { result, invalidatedKeys } = setup();

    act(() => result.current.handleRevoke("inv_1"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(MEMBER_ERROR_MESSAGE.forbidden),
    );
    expect(invalidatedKeys()).toHaveLength(0);
  });
});
