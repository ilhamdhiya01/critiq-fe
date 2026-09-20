"use client";

import classNames from "classnames";
import React, { useCallback, useRef, useState } from "react";

import Icon from "@/components/ui/icon/Icon";
import { useDismissable } from "@/lib/hooks/useDismissable";

interface Organisation {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface OrgSwitcherProps {
  organisations: readonly Organisation[];
  activeOrgId: string;
  isCollapsed: boolean;
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

const OrgSwitcher = React.memo(
  ({ organisations, activeOrgId, isCollapsed }: OrgSwitcherProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    const close = useCallback(() => setIsOpen(false), []);
    useDismissable(isOpen, close, [triggerRef, panelRef]);

    const activeOrg =
      organisations.find((org) => org.id === activeOrgId) ?? organisations[0];

    if (!activeOrg) return null;

    return (
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          title={isCollapsed ? activeOrg.name : undefined}
          className={classNames(
            "flex w-full items-center gap-2.5 rounded-md border border-border-default bg-raised p-2 transition-colors hover:border-[#3a3a3a] hover:bg-raised-alt",
            { "justify-center": isCollapsed },
          )}
        >
          <span className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-md bg-primary-800 font-mono text-[9px] font-bold text-primary-100">
            {initialsOf(activeOrg.name)}
          </span>
          {!isCollapsed && (
            <>
              <span className="flex min-w-0 flex-1 flex-col items-start gap-px">
                <span className="w-full truncate text-left text-xs font-semibold text-text-strong">
                  {activeOrg.name}
                </span>
                <span className="font-mono text-[9.5px] tracking-wider text-text-faint">
                  {activeOrg.role}
                </span>
              </span>
              <Icon
                icon="TbSelector"
                size={12}
                className="shrink-0 text-text-muted"
              />
            </>
          )}
        </button>

        {isOpen && (
          <div
            ref={panelRef}
            role="menu"
            className="absolute top-[calc(100%+6px)] left-0 z-50 w-62.5 overflow-hidden rounded-lg border border-border-default bg-raised-alt shadow-lg"
          >
            <p className="px-3.5 pt-2.5 pb-1 font-mono text-[10px] tracking-wider text-text-muted">
              ORGANIZATIONS
            </p>
            {organisations.map((org) => (
              <button
                key={org.id}
                type="button"
                role="menuitem"
                onClick={close}
                className={classNames(
                  "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors hover:bg-surface-hover",
                  { "bg-primary-600/10": org.id === activeOrg.id },
                )}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary-800 font-mono text-[9px] font-bold text-primary-100">
                  {initialsOf(org.name)}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-px">
                  <span className="truncate text-xs font-semibold text-text-strong">
                    {org.name}
                  </span>
                  <span className="truncate font-mono text-[9.5px] text-text-muted">
                    critiq.app/{org.slug}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-[9.5px] tracking-wider text-text-faint">
                  {org.role}
                </span>
              </button>
            ))}
            <div className="h-px bg-border-subtle" />
            <button
              type="button"
              role="menuitem"
              onClick={close}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-primary-300 transition-colors hover:bg-surface-hover"
            >
              <Icon icon="TbPlus" size={13} className="shrink-0" />
              New organization
            </button>
          </div>
        )}
      </div>
    );
  },
);

OrgSwitcher.displayName = "OrgSwitcher";

export default OrgSwitcher;
