"use client";

import { useRouter } from "next/navigation";
import React, { useMemo } from "react";

import DropdownMenu from "@/components/shared/dropdown-menu";
import GlobalSearch from "@/components/shared/global-search";
import Avatar from "@/components/ui/avatar";
import Icon from "@/components/ui/icon/Icon";
import { useLogout } from "@/lib/hooks/auth/useLogout";
import { useUser } from "@/lib/hooks/auth/useUser";
import { ROUTES } from "@/routes";

interface NavbarProps {
  title: string;
}

// Notifications are presentational for now. Search opens the ⌘K palette; the
// profile menu signs out.
const Navbar = React.memo(({ title }: NavbarProps) => {
  const router = useRouter();
  const { data: user } = useUser();
  const { handleLogout } = useLogout();

  const profileItems = useMemo(
    () => [
      {
        key: "sign-out",
        label: "Sign out",
        onSelect: async () => {
          try {
            await handleLogout();
            router.replace(ROUTES.LOGIN);
          } catch {
            // Toasted in useLogout; stay signed in.
          }
        },
      },
    ],
    [handleLogout, router],
  );

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border-default bg-surface px-5.5">
      <h1 className="font-mono text-[13px] font-semibold text-text-bright">
        {title}
      </h1>

      <div className="flex-1" />

      <GlobalSearch />

      <span className="relative flex text-text-nav">
        <Icon icon="TbBell" size={18} className="stroke-[1.5]" />
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-surface bg-danger" />
      </span>

      <DropdownMenu
        ariaLabel="Account"
        items={profileItems}
        className="min-w-44"
        trigger={({ toggle, isOpen }) => (
          <button
            type="button"
            onClick={toggle}
            aria-haspopup="menu"
            aria-expanded={isOpen}
            aria-label="Account menu"
            className="flex cursor-pointer items-center gap-2.5 border-l border-border-default pl-3.5 text-left"
          >
            {user && (
              <Avatar
                name={user.name ?? ""}
                src={user.avatarUrl}
                size="lg"
                colorClass="bg-info/25 text-info-light"
              />
            )}
            <span className="flex flex-col gap-px">
              <span className="text-[12.5px] leading-tight font-semibold text-text-strong">
                {user?.name}
              </span>
              <span className="font-mono text-[10.5px] text-text-faint">
                TECH LEAD · {user?.provider}
              </span>
            </span>
            <Icon
              icon="TbChevronDown"
              size={13}
              className="shrink-0 text-text-muted"
            />
          </button>
        )}
      />
    </header>
  );
});

Navbar.displayName = "Navbar";

export default Navbar;
