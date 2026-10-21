import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MEMBER_ERROR_MESSAGE } from "@/const/member.constant";
import { membershipWithOrgKeys } from "@/lib/hooks/integrations/queryKeys";
import { toast } from "@/lib/toast";
import type { OrgMember } from "@/lib/types/member.types";
import { removeMember } from "@/services/members.service";

import { membersKeys } from "../queryKeys";
import { useRemoveMember } from "../useRemoveMember";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/services/members.service", () => ({
  removeMember: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const member = (isYou: boolean) =>
  ({ userId: "u_2", name: "Budi", isYou }) as OrgMember;

const setup = () => {
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useRemoveMember("org_1"), { wrapper });
  const invalidatedKeys = () =>
    invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { result, invalidatedKeys };
};

describe("useRemoveMember", () => {
  afterEach(() => vi.clearAllMocks());

  it("removes someone else and refetches the members", async () => {
    vi.mocked(removeMember).mockResolvedValue({ data: null } as never);
    const { result, invalidatedKeys } = setup();

    await act(() => result.current.handleRemove(member(false)));

    expect(removeMember).toHaveBeenCalledWith("org_1", "u_2");
    expect(toast.success).toHaveBeenCalledWith(
      "Budi was removed from the organization",
    );
    expect(invalidatedKeys()).toContainEqual(membersKeys.org("org_1"));
    expect(replace).not.toHaveBeenCalled();
  });

  it("leaving the org refreshes memberships and goes to the root", async () => {
    vi.mocked(removeMember).mockResolvedValue({ data: null } as never);
    const { result, invalidatedKeys } = setup();

    await act(() => result.current.handleRemove(member(true)));

    expect(invalidatedKeys()).toContainEqual(membershipWithOrgKeys.all);
    expect(replace).toHaveBeenCalledWith("/");
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("explains a refused removal", async () => {
    vi.mocked(removeMember).mockRejectedValue(
      Object.assign(new Error("Request failed"), {
        response: { status: 403, data: {} },
      }),
    );
    const { result } = setup();

    await act(() =>
      expect(result.current.handleRemove(member(false))).rejects.toThrow(),
    );

    expect(toast.error).toHaveBeenCalledWith(MEMBER_ERROR_MESSAGE.forbidden);
  });
});
