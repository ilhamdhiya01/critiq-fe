import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MembershipWithOrg } from "@/lib/types/membership.type";

import OrgSwitcher from "../OrgSwitcher";

const push = vi.fn();
let pathname = "/acme";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => pathname,
}));

const member = (
  slug: string,
  name: string,
  onboardingCompleted = true,
): MembershipWithOrg => ({
  id: `m_${slug}`,
  userId: "u1",
  organizationId: `org_${slug}`,
  role: "ADMIN",
  status: "ACTIVE",
  organization: {
    id: `org_${slug}`,
    name,
    slug,
    createdBy: "u1",
    onboardingCompleted,
  },
});

const MEMBERSHIPS = [
  member("acme", "Acme Engineering"),
  member("beta", "Beta Labs"),
  member("draft", "Draft Co", false),
];

const openMenu = () => {
  render(
    <OrgSwitcher
      memberships={MEMBERSHIPS}
      activeSlug="acme"
      isCollapsed={false}
    />,
  );
  fireEvent.click(screen.getByRole("button", { expanded: false }));
  return screen.getByRole("menu");
};

describe("OrgSwitcher", () => {
  beforeEach(() => {
    push.mockReset();
    pathname = "/acme";
  });

  it("shows the org from the URL and lists every membership", () => {
    const menu = openMenu();

    expect(screen.getByRole("button", { expanded: true })).toHaveTextContent(
      "Acme Engineering",
    );
    expect(within(menu).getAllByRole("menuitem")).toHaveLength(4);
    // The org URL uses the host the app is served from.
    expect(
      within(menu).getByText(`${window.location.host}/beta`),
    ).toBeInTheDocument();
  });

  it("labels an unfinished org but still opens it", () => {
    const menu = openMenu();
    const draft = within(menu).getByText("Draft Co").closest("button");

    expect(draft).toHaveTextContent("Finish setup");
    expect(
      within(menu).getByText("Beta Labs").closest("button"),
    ).not.toHaveTextContent("Finish setup");

    fireEvent.click(draft as HTMLElement);
    expect(push).toHaveBeenCalledWith("/draft");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("switches org by navigating to its slug", () => {
    const menu = openMenu();
    fireEvent.click(within(menu).getByText("Beta Labs"));

    expect(push).toHaveBeenCalledWith("/beta");
  });

  it("opens the new-organization wizard", () => {
    const menu = openMenu();
    fireEvent.click(
      within(menu).getByRole("menuitem", { name: /New organization/ }),
    );

    expect(push).toHaveBeenCalledWith("/organizations/new");
  });

  it("keeps the current menu when switching from Settings", () => {
    pathname = "/acme/settings";
    const menu = openMenu();
    fireEvent.click(within(menu).getByText("Beta Labs"));

    expect(push).toHaveBeenCalledWith("/beta/settings");
  });
});
