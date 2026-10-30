import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { userKeys } from "@/lib/hooks/auth/queryKeys";
import { toast } from "@/lib/toast";
import { createOrganization } from "@/services/integrations.service";
import { useOnboardingStore } from "@/stores/onboarding/useOnboardingStore";

import { membershipWithOrgKeys } from "../queryKeys";
import { useCreateOrganization } from "../useCreateOrganization";

vi.mock("@/services/integrations.service", () => ({
  createOrganization: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const SAVED = { id: "org_1", name: "Acme", slug: "acme" };

const setOrganisation = (
  organisation: Partial<
    ReturnType<typeof useOnboardingStore.getState>["organisation"]
  >,
) =>
  useOnboardingStore.setState((state) => ({
    organisation: { ...state.organisation, ...organisation },
  }));

const setup = () => {
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useCreateOrganization(), { wrapper });
  const invalidatedKeys = () =>
    invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { result, invalidatedKeys };
};

describe("useCreateOrganization", () => {
  afterEach(() => {
    vi.clearAllMocks();
    useOnboardingStore.getState().reset();
  });

  it("creates a new org (no id yet) and saves it in the wizard", async () => {
    setOrganisation({ name: "Acme" });
    vi.mocked(createOrganization).mockResolvedValue({
      data: SAVED,
      message: "Created",
    });
    const { result, invalidatedKeys } = setup();

    expect(result.current.needsSave).toBe(true);

    await act(() => result.current.handleCreateOrganization());

    expect(createOrganization).toHaveBeenCalledWith({
      name: "Acme",
      organizationId: undefined,
    });
    expect(useOnboardingStore.getState().organisation).toMatchObject({
      id: "org_1",
      slug: "acme",
      lastSavedName: "Acme",
    });
    expect(result.current.organisationId).toBe("org_1");
    expect(result.current.organisationSlug).toBe("acme");
    expect(result.current.needsSave).toBe(false);
    expect(invalidatedKeys()).toEqual(
      expect.arrayContaining([membershipWithOrgKeys.all, userKeys.all]),
    );
    expect(toast.success).toHaveBeenCalledWith("Created");
  });

  it("renames the existing org instead of creating a second one", async () => {
    setOrganisation({ name: "Acme Inc", id: "org_1", lastSavedName: "Acme" });
    vi.mocked(createOrganization).mockResolvedValue({
      data: { ...SAVED, name: "Acme Inc" },
    });
    const { result } = setup();

    expect(result.current.needsSave).toBe(true);

    await act(() => result.current.handleCreateOrganization());

    expect(createOrganization).toHaveBeenCalledWith({
      name: "Acme Inc",
      organizationId: "org_1",
    });
  });

  it("skips saving when the saved name only differs by whitespace", () => {
    setOrganisation({ name: " Acme ", id: "org_1", lastSavedName: "Acme" });
    const { result } = setup();

    expect(result.current.needsSave).toBe(false);
  });

  it("updates the name through the store setter", () => {
    const { result } = setup();

    act(() => result.current.setOrganisationName("New name"));

    expect(result.current.organisationName).toBe("New name");
  });

  it("toasts the BE message on failure and keeps the wizard unsaved", async () => {
    setOrganisation({ name: "Acme" });
    vi.mocked(createOrganization).mockRejectedValue(
      Object.assign(new Error("Request failed"), {
        response: { status: 409, data: { message: "Slug taken" } },
      }),
    );
    const { result } = setup();

    await act(() =>
      expect(result.current.handleCreateOrganization()).rejects.toThrow(),
    );

    expect(toast.error).toHaveBeenCalledWith("Slug taken");
    expect(useOnboardingStore.getState().organisation.id).toBeNull();
  });

  it("asks the user to wait when creating orgs is rate limited", async () => {
    setOrganisation({ name: "Acme" });
    vi.mocked(createOrganization).mockRejectedValue(
      Object.assign(new Error("org_create_rate_limited"), {
        response: {
          status: 429,
          data: {
            errors: [{ field: "name", message: "org_create_rate_limited" }],
          },
        },
      }),
    );
    const { result } = setup();

    await act(() =>
      expect(result.current.handleCreateOrganization()).rejects.toThrow(),
    );

    expect(toast.error).toHaveBeenCalledWith(
      "Terlalu banyak percobaan, coba lagi nanti",
    );
  });
});
