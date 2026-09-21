"use client";

import classNames from "classnames";
import React from "react";

import Logo from "@/components/shared/logo";
import Icon from "@/components/ui/icon/Icon";
import { useSidebarStore } from "@/stores/useSidebarStore";

import OrgSwitcher from "./OrgSwitcher";
import SidebarNav from "./SidebarNav";

// Placeholder until the org/membership endpoints land; the switcher's shape
// already matches what `useMembershipWithOrg` returns.
const ORGANISATIONS = [
  {
    id: "cititex",
    name: "Cititex Engineering",
    slug: "cititex-engineering",
    role: "ADMIN",
  },
] as const;

const Sidebar = React.memo(() => {
  // Narrow selectors: this component re-renders only when these change.
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);
  const toggleCollapsed = useSidebarStore((state) => state.toggleCollapsed);

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
          organisations={ORGANISATIONS}
          activeOrgId={ORGANISATIONS[0].id}
          isCollapsed={isCollapsed}
        />
      </div>

      <SidebarNav isCollapsed={isCollapsed} />

      <div className="flex-1" />

      <button
        type="button"
        onClick={toggleCollapsed}
        aria-expanded={!isCollapsed}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={classNames(
          "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs text-text-faint transition-colors hover:bg-surface-hover hover:text-text-strong",
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
      </button>
    </aside>
  );
});

Sidebar.displayName = "Sidebar";

export default Sidebar;
