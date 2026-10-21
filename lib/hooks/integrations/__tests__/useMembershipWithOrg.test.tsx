import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { MembershipWithOrg } from "@/lib/types/membership.type";
import { getMembershipWithOrg } from "@/services/membership-with-org.service";
import { useOnboardingStore } from "@/stores/onboarding/useOnboardingStore";

import { useMembershipWithOrg } from "../useMembershipWithOrg";

vi.mock("@/services/membership-with-org.service", () => ({
  getMembershipWithOrg: vi.fn(),
}));

const membership = (id: string, name: string, slug: string) =>
  ({
    organizationId: id,
    organization: { name, slug },
  }) as unknown as MembershipWithOrg;

const MEMBERSHIPS = [
  membership("org_1", "Acme", "acme"),
  membership("org_2", "Globex", "globex"),
];

const setup = (orgId: string | undefined) => {
  const client = new QueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useMembershipWithOrg(orgId), {
    wrapper,
  });
  return { result };
};

describe("useMembershipWithOrg", () => {
  afterEach(() => {
    vi.mocked(getMembershipWithOrg).mockReset();
    useOnboardingStore.getState().reset();
  });

  it("fills the wizard with the org being set up", async () => {
    vi.mocked(getMembershipWithOrg).mockResolvedValue({ data: MEMBERSHIPS });

    const { result } = setup("org_2");

    await waitFor(() => expect(result.current.orgSlug).toBe("globex"));
    expect(result.current.organizations).toEqual(MEMBERSHIPS);
    expect(useOnboardingStore.getState().organisation).toEqual({
      name: "Globex",
      id: "org_2",
      slug: "globex",
      lastSavedName: "Globex",
    });
  });

  it("leaves the wizard empty when starting a new org", async () => {
    vi.mocked(getMembershipWithOrg).mockResolvedValue({ data: MEMBERSHIPS });

    const { result } = setup(undefined);

    await waitFor(() =>
      expect(result.current.organizations).toEqual(MEMBERSHIPS),
    );
    expect(result.current.orgSlug).toBe("");
    expect(useOnboardingStore.getState().organisation.id).toBeNull();
  });

  it("ignores an org the user does not belong to", async () => {
    vi.mocked(getMembershipWithOrg).mockResolvedValue({ data: MEMBERSHIPS });

    const { result } = setup("org_404");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.orgSlug).toBe("");
    expect(useOnboardingStore.getState().organisation.name).toBe("");
  });
});
