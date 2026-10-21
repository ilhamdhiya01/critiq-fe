import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { MembershipWithOrg } from "@/lib/types/membership.type";
import { getMembershipWithOrg } from "@/services/membership-with-org.service";

import OrganisationRedirect from "../OrganisationRedirect";

const replace = vi.fn();
// Stable like Next's router, so effects don't rerun on every render.
const router = { replace, push: vi.fn() };

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

vi.mock("@/services/membership-with-org.service", () => ({
  getMembershipWithOrg: vi.fn(),
}));

const LAST_ORG_KEY = "critiq.lastOrgSlug";
const PENDING_INVITE_KEY = "critiq.pendingInvite";

const membership = (
  slug: string,
  onboardingCompleted: boolean,
): MembershipWithOrg => ({
  id: `m_${slug}`,
  userId: "user_1",
  organizationId: `org_${slug}`,
  role: "ADMIN",
  status: "ACTIVE",
  organization: {
    id: `org_${slug}`,
    name: slug.toUpperCase(),
    slug,
    createdBy: "user_1",
    onboardingCompleted,
  },
});

const DRAFT = membership("draft", false);
const ACME = membership("acme", true);
const GLOBEX = membership("globex", true);

const renderRedirect = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <OrganisationRedirect />
    </QueryClientProvider>,
  );

describe("OrganisationRedirect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
    vi.mocked(getMembershipWithOrg).mockResolvedValue({
      data: [DRAFT, ACME, GLOBEX],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens the last org the user visited", async () => {
    window.localStorage.setItem(LAST_ORG_KEY, "globex");
    renderRedirect();

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/globex"));
    expect(replace).toHaveBeenCalledTimes(1);
  });

  it("falls back to the first finished org when the last one is gone", async () => {
    window.localStorage.setItem(LAST_ORG_KEY, "deleted-org");
    renderRedirect();

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/acme"));
  });

  it("opens the first org when none is finished", async () => {
    vi.mocked(getMembershipWithOrg).mockResolvedValue({
      data: [DRAFT, membership("beta", false)],
    });
    renderRedirect();

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/draft"));
  });

  it("sends a user without organizations to setup", async () => {
    vi.mocked(getMembershipWithOrg).mockResolvedValue({ data: [] });
    renderRedirect();

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/setup"));
  });

  it("lets a pending invite win over every org", async () => {
    window.sessionStorage.setItem(PENDING_INVITE_KEY, "tok_1");
    window.localStorage.setItem(LAST_ORG_KEY, "globex");
    const { container } = renderRedirect();

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/invite/tok_1"));
    await waitFor(() => expect(getMembershipWithOrg).toHaveBeenCalled());
    // Let the memberships settle: still no org redirect.
    await act(async () => {});
    expect(replace).toHaveBeenCalledTimes(1);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows an error with a reload link and redirects nowhere", async () => {
    vi.mocked(getMembershipWithOrg).mockRejectedValue(new Error("boom"));
    renderRedirect();

    expect(
      await screen.findByText("Gagal memuat organisasi"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Muat ulang" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(replace).not.toHaveBeenCalled();
  });

  it("shows the boot loader only after 300ms", () => {
    vi.useFakeTimers();
    vi.mocked(getMembershipWithOrg).mockReturnValue(new Promise(() => {}));
    const { container } = renderRedirect();

    act(() => vi.advanceTimersByTime(299));
    expect(container).toBeEmptyDOMElement();

    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByText("Menyiapkan organisasi kamu…")).toBeInTheDocument();
  });
});
