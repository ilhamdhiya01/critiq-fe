"use client";

import { useParams, usePathname } from "next/navigation";
import React, { useMemo } from "react";

import { NAVIGATION_ITEMS } from "@/const/navigation.constant";
import { ROUTES } from "@/routes";

import NavItem from "./NavItem";

interface SidebarNavProps {
  isCollapsed: boolean;
}

// The dashboard sits at the slug root, so it has to match exactly — a prefix
// test would light it up on every screen inside the organization.
const isRouteActive = (pathname: string, href: string, slug: string) =>
  href === ROUTES.dashboard(slug)
    ? pathname === href
    : pathname.startsWith(href);

const SidebarNav = React.memo(({ isCollapsed }: SidebarNavProps) => {
  const pathname = usePathname();
  const params = useParams<{ slug?: string }>();
  const slug = params?.slug ?? "";

  // Rebuilt only when the slug changes, not on every pathname change.
  const items = useMemo(
    () =>
      NAVIGATION_ITEMS.map((item) => ({
        label: item.label,
        icon: item.icon,
        href: item.buildHref(slug),
      })),
    [slug],
  );

  // Outside an organization there is nothing to link to yet.
  if (!slug) return null;

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Main">
      {items.map((item) => (
        <NavItem
          key={item.href}
          label={item.label}
          href={item.href}
          icon={item.icon}
          isActive={isRouteActive(pathname, item.href, slug)}
          isCollapsed={isCollapsed}
        />
      ))}
    </nav>
  );
});

SidebarNav.displayName = "SidebarNav";

export default SidebarNav;
