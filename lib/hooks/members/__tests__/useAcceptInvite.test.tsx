import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PENDING_INVITE_STORAGE_KEY } from "@/const/member.constant";
import { userKeys } from "@/lib/hooks/auth/queryKeys";
import { membershipWithOrgKeys } from "@/lib/hooks/integrations/queryKeys";
import { toast } from "@/lib/toast";
import { acceptInvite } from "@/services/members.service";

import { useAcceptInvite } from "../useAcceptInvite";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/services/members.service", () => ({
  acceptInvite: vi.fn(),
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
  const { result } = renderHook(() => useAcceptInvite("tok_1"), { wrapper });
  const invalidatedKeys = () =>
    invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { result, invalidatedKeys };
};

const rejectWith = (status: number, code?: string, message = "boom") =>
  vi.mocked(acceptInvite).mockRejectedValue(
    Object.assign(new Error(message), {
      response: {
        status,
        data: code ? { errors: [{ field: "token", message: code }] } : {},
      },
    }),
  );

const pendingInvite = () =>
  window.sessionStorage.getItem(PENDING_INVITE_STORAGE_KEY);

describe("useAcceptInvite", () => {
  beforeEach(() =>
    window.sessionStorage.setItem(PENDING_INVITE_STORAGE_KEY, "tok_1"),
  );

  afterEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
  });

  it("joins the org, refreshes the session and opens its dashboard", async () => {
    vi.mocked(acceptInvite).mockResolvedValue({
      data: { organization: { slug: "acme" } },
    } as never);
    const { result, invalidatedKeys } = setup();

    act(() => result.current.handleAccept());

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/acme"));
    expect(acceptInvite).toHaveBeenCalledWith("tok_1");
    expect(pendingInvite()).toBeNull();
    expect(invalidatedKeys()).toEqual(
      expect.arrayContaining([userKeys.all, membershipWithOrgKeys.all]),
    );
  });

  it("clears the pending invite when the account is already a member", async () => {
    rejectWith(409, "already_member");
    const { result } = setup();

    act(() => result.current.handleAccept());

    await waitFor(() => expect(result.current.isAlreadyMember).toBe(true));
    expect(pendingInvite()).toBeNull();
    expect(result.current.failedStatus).toBeNull();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("asks the user to wait when accepting is rate limited", async () => {
    rejectWith(429, "invite_accept_rate_limited");
    const { result } = setup();

    act(() => result.current.handleAccept());

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Terlalu banyak percobaan, coba lagi nanti",
      ),
    );
    expect(result.current.failedStatus).toBeNull();
  });

  it.each([
    ["invite_expired", "expired"],
    ["invite_revoked", "revoked"],
    ["invite_used", "accepted"],
  ])("turns %s (410) into the %s state", async (code, status) => {
    rejectWith(410, code);
    const { result } = setup();

    act(() => result.current.handleAccept());

    await waitFor(() => expect(result.current.failedStatus).toBe(status));
    expect(pendingInvite()).toBeNull();
    expect(replace).not.toHaveBeenCalled();
  });

  it("toasts any other failure and keeps the invite page as is", async () => {
    rejectWith(500, undefined, "Network Error");
    const { result } = setup();

    act(() => result.current.handleAccept());

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Network Error"),
    );
    expect(result.current.failedStatus).toBeNull();
    expect(result.current.isAlreadyMember).toBe(false);
    expect(pendingInvite()).toBe("tok_1");
  });
});
