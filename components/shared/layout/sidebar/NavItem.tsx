import Link from "next/link";
import React from "react";
import { tv } from "tailwind-variants";

import Icon, { type IconName } from "@/components/ui/icon/Icon";

const navItem = tv({
  base: "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-colors",
  variants: {
    isActive: {
      true: "bg-surface-active text-foreground",
      false: "text-text-nav hover:bg-surface-hover hover:text-text-strong",
    },
    isCollapsed: {
      true: "justify-center px-0",
    },
  },
  defaultVariants: {
    isActive: false,
    isCollapsed: false,
  },
});

interface NavItemProps {
  label: string;
  href: string;
  icon: IconName;
  isActive: boolean;
  isCollapsed: boolean;
}

const NavItem = React.memo(
  ({ label, href, icon, isActive, isCollapsed }: NavItemProps) => {
    return (
      <Link
        href={href}
        className={navItem({ isActive, isCollapsed })}
        aria-current={isActive ? "page" : undefined}
        // The label is the accessible name once it is visually hidden.
        title={isCollapsed ? label : undefined}
      >
        <Icon icon={icon} size={17} className="shrink-0 stroke-[1.5]" />
        {!isCollapsed && <span className="truncate">{label}</span>}
      </Link>
    );
  },
);

NavItem.displayName = "NavItem";

export default NavItem;
