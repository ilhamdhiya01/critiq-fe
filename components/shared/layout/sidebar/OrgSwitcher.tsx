"use client";

import classNames from "classnames";
import { usePathname, useRouter } from "next/navigation";
import React, { useCallback, useRef, useState } from "react";

import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon/Icon";
import { getOrgSwitchHref } from "@/lib/helpers/organization.helper";
import { useAppHost } from "@/lib/hooks/useAppHost";
import { useDismissable } from "@/lib/hooks/useDismissable";
import type { MembershipWithOrg } from "@/lib/types/membership.type";
import { ROUTES } from "@/routes";

interface OrgSwitcherProps {
  memberships: readonly MembershipWithOrg[];
  // The org in the URL.
  activeSlug: string;
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
  ({ memberships, activeSlug, isCollapsed }: OrgSwitcherProps) => {
    const router = useRouter();
    const pathname = usePathname();
    const appHost = useAppHost();
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement | HTMLAnchorElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    const close = useCallback(() => setIsOpen(false), []);
    useDismissable(isOpen, close, [triggerRef, panelRef]);

    // Switching is just navigating: the org layout reads the org from the
    // slug, so no API call is needed. An unfinished org opens too (its pages
    // show the setup banner); its badge is informational.
    const handleOpen = (href: string) => {
      close();
      router.push(href);
    };

    const active =
      memberships.find((item) => item.organization.slug === activeSlug) ??
      memberships[0];

    if (!active) return null;
    const activeOrg = active.organization;

    return (
      <div className="relative">
        <Button
          ref={triggerRef}
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          title={isCollapsed ? activeOrg.name : undefined}
          className={classNames(
            "gap-2.5 bg-raised p-2 font-normal hover:border-[#3a3a3a]",
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
                  {active.role}
                </span>
              </span>
              <Icon
                icon="TbSelector"
                size={12}
                className="shrink-0 text-text-muted"
              />
            </>
          )}
        </Button>

        {isOpen && (
          <div
            ref={panelRef}
            role="menu"
            className="absolute top-[calc(100%+6px)] left-0 z-50 w-[min(250px,calc(100vw-2rem))] overflow-hidden rounded-lg border border-border-default bg-raised-alt shadow-lg"
          >
            <p className="px-3.5 pt-2.5 pb-1 font-mono text-[10px] tracking-wider text-text-muted">
              ORGANIZATIONS
            </p>
            {memberships.map((membership) => {
              const org = membership.organization;
              const isUnfinished = org.onboardingCompleted === false;
              return (
                <button
                  key={membership.id}
                  type="button"
                  role="menuitem"
                  onClick={() =>
                    handleOpen(getOrgSwitchHref(pathname, org.slug))
                  }
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
                      {appHost}
                      {ROUTES.dashboard(org.slug)}
                    </span>
                  </span>
                  {isUnfinished ? (
                    <Badge tone="orange" size="xs" weight="normal">
                      Finish setup
                    </Badge>
                  ) : (
                    <span className="shrink-0 font-mono text-[9.5px] tracking-wider text-text-faint">
                      {membership.role}
                    </span>
                  )}
                </button>
              );
            })}
            <div className="h-px bg-border-subtle" />
            <button
              type="button"
              role="menuitem"
              onClick={() => handleOpen(ROUTES.NEW_ORGANIZATION)}
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
