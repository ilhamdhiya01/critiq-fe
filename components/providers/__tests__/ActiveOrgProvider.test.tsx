import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useActiveOrgId } from "@/lib/hooks/organisation/useActiveOrg";
import type { MembershipWithOrg } from "@/lib/types/membership.type";
import { getMembershipWithOrg } from "@/services/membership-with-org.service";

import ActiveOrgProvider from "../ActiveOrgProvider";

let slug = "acme";
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ slug }),
  useRouter: () => ({ replace }),
}));

vi.mock("@/services/membership-with-org.service", () => ({
  getMembershipWithOrg: vi.fn(),
}));

const member = (
  orgSlug: string,
  onboardingCompleted = true,
): MembershipWithOrg => ({
  id: `m_${orgSlug}`,
  userId: "u1",
  organizationId: `org_${orgSlug}`,
  role: "ADMIN",
  status: "ACTIVE",
  organization: {
    id: `org_${orgSlug}`,
    name: orgSlug,
    slug: orgSlug,
    createdBy: "u1",
    onboardingCompleted,
  },
});

const OrgProbe = () => <span>org:{useActiveOrgId() ?? "none"}</span>;

const renderProvider = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ActiveOrgProvider>
        <OrgProbe />
      </ActiveOrgProvider>
    </QueryClientProvider>,
  );

describe("ActiveOrgProvider", () => {
  beforeEach(() => {
    replace.mockReset();
    localStorage.clear();
    vi.mocked(getMembershipWithOrg).mockResolvedValue({
      data: [member("acme"), member("draft", false)],
    });
  });

  it("gives pages the org named by the slug and remembers it", async () => {
    slug = "acme";
    renderProvider();

    expect(await screen.findByText("org:org_acme")).toBeInTheDocument();
    expect(localStorage.getItem("critiq.lastOrgSlug")).toBe("acme");
    expect(replace).not.toHaveBeenCalled();
  });

  it("opens an unfinished org too, without sending it to the wizard", async () => {
    slug = "draft";
    renderProvider();

    expect(await screen.findByText("org:org_draft")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
    expect(localStorage.getItem("critiq.lastOrgSlug")).toBe("draft");
  });

  it("sends a slug the user doesn't belong to back to /", async () => {
    slug = "someone-else";
    renderProvider();

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });

  it("renders while memberships load, without an org yet", () => {
    slug = "acme";
    vi.mocked(getMembershipWithOrg).mockReturnValue(new Promise(() => {}));
    renderProvider();

    expect(screen.getByText("org:none")).toBeInTheDocument();
  });
});
