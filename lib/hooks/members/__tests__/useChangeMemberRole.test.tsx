import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MEMBER_ERROR_MESSAGE } from "@/const/member.constant";
import { toast } from "@/lib/toast";
import type { ApiResponse } from "@/lib/types/api.types";
import type { MembersData, OrgMember } from "@/lib/types/member.types";
import { changeMemberRole } from "@/services/members.service";

import { membersKeys } from "../queryKeys";
import { useChangeMemberRole } from "../useChangeMemberRole";

vi.mock("@/services/members.service", () => ({
  changeMemberRole: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const member = (userId: string, role: OrgMember["role"]) =>
  ({ userId, role }) as OrgMember;

const CACHED: ApiResponse<MembersData> = {
  data: {
    members: [member("u_1", "admin"), member("u_2", "viewer")],
    invites: [],
  },
};

const setup = () => {
  const client = new QueryClient();
  client.setQueryData(membersKeys.list("org_1"), CACHED);
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useChangeMemberRole("org_1"), {
    wrapper,
  });
  const roles = () =>
    client
      .getQueryData<ApiResponse<MembersData>>(membersKeys.list("org_1"))
      ?.data.members.map((item) => item.role);
  const invalidatedKeys = () =>
    invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { result, roles, invalidatedKeys };
};

describe("useChangeMemberRole", () => {
  afterEach(() => vi.clearAllMocks());

  it("shows the new role right away, then refetches the members", async () => {
    let resolve: (value: unknown) => void = () => {};
    vi.mocked(changeMemberRole).mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }) as never,
    );
    const { result, roles, invalidatedKeys } = setup();

    act(() =>
      result.current.handleChangeRole({ userId: "u_2", role: "reviewer" }),
    );

    await waitFor(() => expect(roles()).toEqual(["admin", "reviewer"]));
    expect(result.current.isChangingRole).toBe(true);
    expect(changeMemberRole).toHaveBeenCalledWith("org_1", "u_2", "reviewer");

    await act(async () => resolve({ data: null }));

    await waitFor(() =>
      expect(invalidatedKeys()).toContainEqual(membersKeys.org("org_1")),
    );
    expect(roles()).toEqual(["admin", "reviewer"]);
  });

  it("rolls back and explains when the BE refuses", async () => {
    vi.mocked(changeMemberRole).mockRejectedValue(
      Object.assign(new Error("Request failed"), {
        response: { status: 409, data: { message: "last_admin" } },
      }),
    );
    const { result, roles, invalidatedKeys } = setup();

    act(() =>
      result.current.handleChangeRole({ userId: "u_1", role: "viewer" }),
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(MEMBER_ERROR_MESSAGE.last_admin),
    );
    expect(roles()).toEqual(["admin", "viewer"]);
    expect(invalidatedKeys()).toContainEqual(membersKeys.org("org_1"));
  });
});
