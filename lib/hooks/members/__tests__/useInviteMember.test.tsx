import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MEMBER_ERROR_MESSAGE } from "@/const/member.constant";
import { inviteMember, resendInvite } from "@/services/members.service";

import { membersKeys } from "../queryKeys";
import { useInviteMember } from "../useInviteMember";

vi.mock("@/services/members.service", () => ({
  inviteMember: vi.fn(),
  resendInvite: vi.fn(),
}));

const INPUT = { email: "new@acme.dev", role: "reviewer" as const };
const RESULT = {
  invite: { id: "inv_1" },
  inviteUrl: "https://critiq.dev/invite/tok",
};

const setup = () => {
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useInviteMember("org_1"), { wrapper });
  const invalidatedKeys = () =>
    invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { client, result, invalidatedKeys };
};

const httpError = (status: number, code: string) =>
  Object.assign(new Error("Request failed"), {
    response: { status, data: { errors: [{ field: "email", message: code }] } },
  });

describe("useInviteMember", () => {
  afterEach(() => vi.clearAllMocks());

  it("keeps the one-time link in state, not in the query cache", async () => {
    vi.mocked(inviteMember).mockResolvedValue({ data: RESULT } as never);
    const { client, result, invalidatedKeys } = setup();

    await act(() => result.current.handleInvite(INPUT));

    expect(inviteMember).toHaveBeenCalledWith("org_1", INPUT);
    expect(result.current.inviteResult).toEqual(RESULT);
    expect(invalidatedKeys()).toContainEqual(membersKeys.org("org_1"));
    const cached = client
      .getQueryCache()
      .getAll()
      .map((query) => query.state.data);
    expect(JSON.stringify(cached)).not.toContain(RESULT.inviteUrl);

    act(() => result.current.clearResult());
    expect(result.current.inviteResult).toBeNull();
  });

  it("maps the error code so the caller can offer Resend", async () => {
    vi.mocked(inviteMember).mockRejectedValue(httpError(409, "invite_pending"));
    const { result } = setup();

    await act(() =>
      expect(result.current.handleInvite(INPUT)).rejects.toThrow(),
    );

    expect(result.current.inviteError).toEqual({
      code: "invite_pending",
      message: MEMBER_ERROR_MESSAGE.invite_pending,
    });

    act(() => result.current.clearError());
    expect(result.current.inviteError).toBeNull();
  });

  it("tracks which invite is being resent and clears the old error", async () => {
    vi.mocked(inviteMember).mockRejectedValue(httpError(409, "invite_pending"));
    let resolve: (value: unknown) => void = () => {};
    vi.mocked(resendInvite).mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }) as never,
    );
    const { result } = setup();

    await act(() =>
      expect(result.current.handleInvite(INPUT)).rejects.toThrow(),
    );
    expect(result.current.inviteError).not.toBeNull();

    let pending: Promise<unknown> = Promise.resolve();
    act(() => {
      pending = result.current.handleResend("inv_1");
    });

    await waitFor(() => expect(result.current.resendingId).toBe("inv_1"));
    expect(result.current.isResending).toBe(true);
    expect(result.current.inviteError).toBeNull();

    await act(async () => {
      resolve({ data: RESULT });
      await pending;
    });

    expect(result.current.resendingId).toBeUndefined();
    expect(result.current.inviteResult).toEqual(RESULT);
    expect(resendInvite).toHaveBeenCalledWith("org_1", "inv_1");
  });
});
