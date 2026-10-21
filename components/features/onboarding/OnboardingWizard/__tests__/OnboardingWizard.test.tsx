import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DecodedToken } from "@/lib/types/auth.types";
import type { MembershipWithOrg } from "@/lib/types/membership.type";
import { createOrganization } from "@/services/integrations.service";
import { getMembershipWithOrg } from "@/services/membership-with-org.service";
import { useOnboardingStore } from "@/stores/onboarding/useOnboardingStore";

import OnboardingWizard from "../OnboardingWizard";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/organizations/new",
}));

vi.mock("@/services/integrations.service", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  createOrganization: vi.fn(),
}));

vi.mock("@/services/membership-with-org.service", () => ({
  getMembershipWithOrg: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

// Step 2 talks to the provider; only its footer matters here.
vi.mock("../../RepositoriesStep", () => ({
  default: ({ footer }: { footer: React.ReactNode }) => (
    <div>
      <p>Repositories step</p>
      {footer}
    </div>
  ),
}));

const TOKEN: DecodedToken = {
  sub: "u1",
  activeOrgId: "org_acme",
  role: "ADMIN",
  provider: "GITHUB",
  onboardingCompleted: true,
};

const member = (
  slug: string,
  onboardingCompleted = true,
): MembershipWithOrg => ({
  id: `m_${slug}`,
  userId: "u1",
  organizationId: `org_${slug}`,
  role: "ADMIN",
  status: "ACTIVE",
  organization: {
    id: `org_${slug}`,
    name: slug === "acme" ? "Acme Engineering" : slug,
    slug,
    createdBy: "u1",
    onboardingCompleted,
  },
});

const renderNew = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <OnboardingWizard decodedToken={TOKEN} mode="new" />
    </QueryClientProvider>,
  );

const nameInput = () =>
  screen.getByPlaceholderText("e.g. Cititex Engineering") as HTMLInputElement;
const clickButton = (name: string) =>
  fireEvent.click(screen.getByRole("button", { name }));

describe("OnboardingWizard (new organization)", { timeout: 15_000 }, () => {
  beforeEach(() => {
    replace.mockReset();
    sessionStorage.clear();
    localStorage.clear();
    // Left over from an earlier wizard run in the same session.
    useOnboardingStore.setState({
      organisation: {
        name: "Acme Engineering",
        id: "org_acme",
        slug: "acme",
        lastSavedName: "Acme Engineering",
      },
    });
    vi.mocked(getMembershipWithOrg).mockResolvedValue({
      data: [member("acme")],
    });
    vi.mocked(createOrganization)
      .mockReset()
      .mockImplementation(async ({ name, organizationId }) => ({
        data: { id: organizationId ?? "org_nova", name, slug: "nova" },
      }));
  });

  it("starts empty instead of the active org", async () => {
    renderNew();

    expect(nameInput()).toHaveValue("");
    // Memberships load, but never prefill a new org.
    await waitFor(() => expect(getMembershipWithOrg).toHaveBeenCalled());
    expect(nameInput()).toHaveValue("");
  });

  it("creates the org once, then renames it after Back → Continue", async () => {
    renderNew();

    fireEvent.change(nameInput(), { target: { value: "Nova" } });
    clickButton("Continue");
    expect(await screen.findByText("Repositories step")).toBeInTheDocument();
    expect(createOrganization).toHaveBeenCalledTimes(1);
    expect(createOrganization).toHaveBeenLastCalledWith({
      name: "Nova",
      organizationId: undefined,
    });

    // Unchanged name: nothing to save.
    clickButton("Back");
    expect(nameInput()).toHaveValue("Nova");
    clickButton("Continue");
    await screen.findByText("Repositories step");
    expect(createOrganization).toHaveBeenCalledTimes(1);

    // Renamed: PATCH the same org, never a second POST.
    clickButton("Back");
    fireEvent.change(nameInput(), { target: { value: "Nova Labs" } });
    clickButton("Continue");
    await screen.findByText("Repositories step");
    expect(createOrganization).toHaveBeenCalledTimes(2);
    expect(createOrganization).toHaveBeenLastCalledWith({
      name: "Nova Labs",
      organizationId: "org_nova",
    });
  });

  it("cancels back to the previous org", async () => {
    localStorage.setItem("critiq.lastOrgSlug", "acme");
    renderNew();

    fireEvent.click(await screen.findByRole("button", { name: "Cancel" }));
    expect(replace).toHaveBeenCalledWith("/acme");
  });

  it("cancels to another org even if its setup is unfinished", async () => {
    vi.mocked(getMembershipWithOrg).mockResolvedValue({
      data: [member("draft", false)],
    });
    renderNew();

    fireEvent.click(await screen.findByRole("button", { name: "Cancel" }));
    expect(replace).toHaveBeenCalledWith("/draft");
  });

  it("has no Cancel when there is no other org to go back to", async () => {
    vi.mocked(getMembershipWithOrg).mockResolvedValue({ data: [] });
    renderNew();

    // Wait until memberships have rendered (Continue re-renders with them).
    await waitFor(() => expect(getMembershipWithOrg).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(
      screen.queryByRole("button", { name: "Cancel" }),
    ).not.toBeInTheDocument();
  });
});
