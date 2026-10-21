import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SidebarNav from "../SidebarNav";

const route = { pathname: "/acme", slug: "acme" as string | undefined };

vi.mock("next/navigation", () => ({
  usePathname: () => route.pathname,
  useParams: () => ({ slug: route.slug }),
}));

const activeLinks = () =>
  screen
    .getAllByRole("link")
    .filter((link) => link.getAttribute("aria-current") === "page");

describe("SidebarNav", () => {
  beforeEach(() => {
    route.pathname = "/acme";
    route.slug = "acme";
  });

  it("links every section inside the organization", () => {
    render(<SidebarNav isCollapsed={false} />);
    const nav = screen.getByRole("navigation", { name: "Main" });

    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/acme",
    );
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "href",
      "/acme/settings",
    );
    expect(screen.getAllByRole("link")).toHaveLength(7);
  });

  it("marks only the dashboard active at the slug root", () => {
    render(<SidebarNav isCollapsed={false} />);

    expect(activeLinks()).toEqual([
      screen.getByRole("link", { name: "Dashboard" }),
    ]);
  });

  it("marks a section active on its nested pages, never the dashboard", () => {
    route.pathname = "/acme/pull-requests/42";
    render(<SidebarNav isCollapsed={false} />);

    expect(activeLinks()).toEqual([
      screen.getByRole("link", { name: "Pull Requests" }),
    ]);
  });

  it("renders nothing outside an organization", () => {
    route.slug = undefined;
    const { container } = render(<SidebarNav isCollapsed={false} />);

    expect(container).toBeEmptyDOMElement();
  });
});
