"use client";

import classNames from "classnames";
import { useParams, usePathname } from "next/navigation";
import React, { useEffect, useRef } from "react";

import Logo from "@/components/shared/logo";
import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon/Icon";
import {
  APP_CONTENT_ID,
  DESKTOP_MEDIA_QUERY,
  SIDEBAR_ID,
} from "@/const/layout.constant";
import { useMemberships } from "@/lib/hooks/organisation/useMemberships";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import type { MembershipWithOrg } from "@/lib/types/membership.type";
import { useSidebarStore } from "@/stores/useSidebarStore";

import OrgSwitcher from "./OrgSwitcher";
import SidebarNav from "./SidebarNav";

// Stable empty list while memberships load (OrgSwitcher is memoised).
const NO_MEMBERSHIPS: MembershipWithOrg[] = [];

// Docked from lg up (with the collapsible rail); below lg an off-canvas
// drawer opened from the navbar's menu button.
const Sidebar = React.memo(() => {
  // Narrow selectors: this component re-renders only when these change.
  const isCollapsedSetting = useSidebarStore((state) => state.isCollapsed);
  const toggleCollapsed = useSidebarStore((state) => state.toggleCollapsed);
  const isMobileOpen = useSidebarStore((state) => state.isMobileOpen);
  const closeMobile = useSidebarStore((state) => state.closeMobile);
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const params = useParams<{ slug?: string }>();
  const pathname = usePathname();
  const { data: memberships } = useMemberships();
  const closeButtonRef = useRef<HTMLButtonElement | HTMLAnchorElement>(null);

  // The drawer always shows labels; only the docked sidebar collapses.
  const isCollapsed = isDesktop && isCollapsedSetting;

  // Navigating from the drawer closes it.
  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  // Growing to desktop docks the sidebar; don't leave the drawer state open.
  useEffect(() => {
    if (isDesktop) closeMobile();
  }, [isDesktop, closeMobile]);

  // While open: focus moves into the drawer, the page behind is inert, and
  // Escape closes it. On close, focus returns to what opened it.
  useEffect(() => {
    if (!isMobileOpen) return;
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const content = document.getElementById(APP_CONTENT_ID);
    content?.setAttribute("inert", "");
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMobile();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      content?.removeAttribute("inert");
      opener?.focus();
    };
  }, [isMobileOpen, closeMobile]);

  return (
    <>
      {isMobileOpen && (
        <div
          aria-hidden
          data-testid="sidebar-backdrop"
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}
      <aside
        id={SIDEBAR_ID}
        aria-label="Sidebar"
        // Closed drawer: off screen and `invisible` (out of the tab order),
        // pure CSS so the server HTML is right before hydration. From lg the
        // translate is `none`: any other value makes a stacking context that
        // traps OrgSwitcher's panel under the page.
        className={classNames(
          "fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] shrink-0 flex-col gap-0.5 border-r border-border-default bg-raised-alt px-2.5 py-3.5 transition-[translate,width,visibility] duration-200 motion-reduce:transition-none lg:static lg:z-auto lg:max-w-none lg:translate-none",
          {
            "-translate-x-full max-lg:invisible": !isMobileOpen,
            "lg:w-17": isCollapsedSetting,
          },
        )}
      >
        <div
          className={classNames("flex items-center px-2.5 pt-1 pb-4", {
            "justify-center px-0": isCollapsed,
          })}
        >
          <Logo
            size={24}
            withWordmark={!isCollapsed}
            wordmarkClassName="text-sm"
          />
          <Button
            ref={closeButtonRef}
            type="button"
            variant="icon"
            size="sm"
            fullWidth={false}
            onClick={closeMobile}
            aria-label="Close menu"
            className="ml-auto lg:hidden"
            icon={<Icon icon="TbX" size={17} />}
          />
        </div>

        <div
          className={classNames({ "pb-3": !isCollapsed, "pb-2": isCollapsed })}
        >
          <OrgSwitcher
            memberships={memberships ?? NO_MEMBERSHIPS}
            activeSlug={params?.slug ?? ""}
            isCollapsed={isCollapsed}
          />
        </div>

        {/* Only the nav scrolls on short screens, so the org switcher's
            panel above is never clipped. */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <SidebarNav isCollapsed={isCollapsed} />
        </div>

        <Button
          type="button"
          variant="icon"
          size="sm"
          onClick={toggleCollapsed}
          aria-expanded={!isCollapsed}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={classNames(
            "hidden justify-start gap-2.5 px-2.5 py-2 text-xs font-normal text-text-faint lg:flex",
            { "justify-center px-0": isCollapsed },
          )}
        >
          <Icon
            icon="TbLayoutSidebarLeftCollapse"
            size={17}
            className={classNames(
              "shrink-0 stroke-[1.5] transition-transform",
              {
                "rotate-180": isCollapsed,
              },
            )}
          />
          {!isCollapsed && <span>Collapse</span>}
        </Button>
      </aside>
    </>
  );
});

Sidebar.displayName = "Sidebar";

export default Sidebar;
