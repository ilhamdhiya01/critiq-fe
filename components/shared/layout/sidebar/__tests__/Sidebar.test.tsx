import { act, fireEvent, render, screen } from "@testing-library/react";
import { useSyncExternalStore } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useSidebarStore } from "@/stores/useSidebarStore";

import Sidebar from "../Sidebar";

// Reactive like Next's: changing it re-renders subscribers.
const route = { pathname: "/acme", listeners: new Set<() => void>() };
const navigate = (pathname: string) =>
  act(() => {
    route.pathname = pathname;
    route.listeners.forEach((listener) => listener());
  });

vi.mock("next/navigation", () => ({
  useParams: () => ({ slug: "acme" }),
  usePathname: () =>
    useSyncExternalStore(
      (onChange) => {
        route.listeners.add(onChange);
        return () => route.listeners.delete(onChange);
      },
      () => route.pathname,
    ),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/hooks/organisation/useMemberships", () => ({
  useMemberships: () => ({ data: [] }),
}));

const setDesktop = (isDesktop: boolean) =>
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: isDesktop,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );

const aside = () => screen.getByRole("complementary", { hidden: true });

describe("Sidebar", () => {
  beforeEach(() => {
    route.pathname = "/acme";
    useSidebarStore.setState({ isCollapsed: false, isMobileOpen: false });
  });

  afterEach(() => vi.unstubAllGlobals());

  describe("below lg (drawer)", () => {
    beforeEach(() => setDesktop(false));

    it("stays off screen and out of the tab order until opened", () => {
      render(<Sidebar />);

      // `invisible` (visibility: hidden) is what keeps it out of the tab order.
      expect(aside()).toHaveClass("-translate-x-full", "max-lg:invisible");
      expect(screen.queryByTestId("sidebar-backdrop")).not.toBeInTheDocument();

      act(() => useSidebarStore.getState().openMobile());
      expect(aside()).not.toHaveClass("max-lg:invisible");
      expect(screen.getByTestId("sidebar-backdrop")).toBeInTheDocument();
    });

    it("moves focus into the drawer, makes the page inert, and restores both", () => {
      render(
        <>
          <button type="button">Open menu</button>
          <div id="app-content">Page</div>
          <Sidebar />
        </>,
      );
      const opener = screen.getByRole("button", { name: "Open menu" });
      opener.focus();

      act(() => useSidebarStore.getState().openMobile());
      expect(screen.getByRole("button", { name: "Close menu" })).toHaveFocus();
      expect(screen.getByText("Page")).toHaveAttribute("inert");

      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.getByText("Page")).not.toHaveAttribute("inert");
      expect(opener).toHaveFocus();
    });

    it("closes from the backdrop, the close button and Escape", () => {
      render(<Sidebar />);

      act(() => useSidebarStore.getState().openMobile());
      fireEvent.click(screen.getByTestId("sidebar-backdrop"));
      expect(useSidebarStore.getState().isMobileOpen).toBe(false);

      act(() => useSidebarStore.getState().openMobile());
      fireEvent.click(screen.getByRole("button", { name: "Close menu" }));
      expect(useSidebarStore.getState().isMobileOpen).toBe(false);

      act(() => useSidebarStore.getState().openMobile());
      fireEvent.keyDown(document, { key: "Escape" });
      expect(useSidebarStore.getState().isMobileOpen).toBe(false);
    });

    it("closes after navigating", () => {
      render(<Sidebar />);
      act(() => useSidebarStore.getState().openMobile());

      navigate("/acme/settings");
      expect(useSidebarStore.getState().isMobileOpen).toBe(false);
    });

    it("always shows labels in the drawer, even if collapsed on desktop", () => {
      useSidebarStore.setState({ isCollapsed: true });
      render(<Sidebar />);

      expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0);
    });
  });

  describe("lg and up (docked)", () => {
    beforeEach(() => setDesktop(true));

    it("closes a drawer left open when the screen grows to desktop", () => {
      useSidebarStore.setState({ isMobileOpen: true });
      render(<Sidebar />);

      expect(useSidebarStore.getState().isMobileOpen).toBe(false);
    });

    it("can collapse to a rail", () => {
      render(<Sidebar />);

      fireEvent.click(screen.getByRole("button", { name: "Collapse" }));
      expect(useSidebarStore.getState().isCollapsed).toBe(true);
    });
  });
});
