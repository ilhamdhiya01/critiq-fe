"use client";

import classNames from "classnames";
import { useParams } from "next/navigation";
import React from "react";

import Logo from "@/components/shared/logo";
import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon/Icon";
import { useMemberships } from "@/lib/hooks/organisation/useMemberships";
import type { MembershipWithOrg } from "@/lib/types/membership.type";
import { useSidebarStore } from "@/stores/useSidebarStore";

import OrgSwitcher from "./OrgSwitcher";
import SidebarNav from "./SidebarNav";

// Stable empty list while memberships load (OrgSwitcher is memoised).
const NO_MEMBERSHIPS: MembershipWithOrg[] = [];

const Sidebar = React.memo(() => {
  // Narrow selectors: this component re-renders only when these change.
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);
  const toggleCollapsed = useSidebarStore((state) => state.toggleCollapsed);
  const params = useParams<{ slug?: string }>();
  const { data: memberships } = useMemberships();

  return (
    <aside
      className={classNames(
        "flex shrink-0 flex-col gap-0.5 border-r border-border-default bg-raised-alt px-2.5 py-3.5 transition-[width] duration-200",
        isCollapsed ? "w-17" : "w-64",
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

      <SidebarNav isCollapsed={isCollapsed} />

      <div className="flex-1" />

      <Button
        type="button"
        variant="icon"
        size="sm"
        onClick={toggleCollapsed}
        aria-expanded={!isCollapsed}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={classNames(
          "justify-start gap-2.5 px-2.5 py-2 text-xs font-normal text-text-faint",
          { "justify-center px-0": isCollapsed },
        )}
      >
        <Icon
          icon="TbLayoutSidebarLeftCollapse"
          size={17}
          className={classNames("shrink-0 stroke-[1.5] transition-transform", {
            "rotate-180": isCollapsed,
          })}
        />
        {!isCollapsed && <span>Collapse</span>}
      </Button>
    </aside>
  );
});

Sidebar.displayName = "Sidebar";

export default Sidebar;
