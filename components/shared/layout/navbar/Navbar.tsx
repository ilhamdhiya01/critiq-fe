"use client";

import { useRouter } from "next/navigation";
import React, { useMemo } from "react";

import type { DropdownMenuItem } from "@/components/shared/dropdown-menu";
import DropdownMenu from "@/components/shared/dropdown-menu";
import GlobalSearch from "@/components/shared/global-search";
import Avatar from "@/components/ui/avatar";
import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon/Icon";
import { SIDEBAR_ID } from "@/const/layout.constant";
import { useLogout } from "@/lib/hooks/auth/useLogout";
import { useUser } from "@/lib/hooks/auth/useUser";
import { useActiveOrg } from "@/lib/hooks/organisation/useActiveOrg";
import { ROUTES } from "@/routes";
import { useSidebarStore } from "@/stores/useSidebarStore";

interface NavbarProps {
  title: string;
}

// Search opens the ⌘K palette; the account menu shows who is signed in,
// Preferences (the org's Settings) and sign out.
const Navbar = React.memo(({ title }: NavbarProps) => {
  const router = useRouter();
  const { data: user } = useUser();
  const { handleLogout } = useLogout();
  const { membership } = useActiveOrg();
  const isMobileOpen = useSidebarStore((state) => state.isMobileOpen);
  const openMobile = useSidebarStore((state) => state.openMobile);

  const orgSlug = membership?.organization.slug;
  const profileItems = useMemo<DropdownMenuItem[]>(
    () => [
      ...(orgSlug
        ? [
            {
              key: "preferences",
              label: "Preferences",
              icon: "TbSettings" as const,
              onSelect: () => router.push(ROUTES.settings(orgSlug)),
            },
          ]
        : []),
      {
        key: "sign-out",
        label: "Sign out",
        icon: "TbLogout",
        tone: "danger",
        separated: !!orgSlug,
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
    [orgSlug, handleLogout, router],
  );

  const profileHeader = useMemo(
    () =>
      user && (
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-[13px] font-semibold text-text-strong">
            {user.name}
          </span>
          <span className="font-mono text-[11.5px] break-all text-text-muted">
            {user.email}
          </span>
        </div>
      ),
    [user],
  );

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border-default bg-surface px-3 sm:gap-4 sm:px-5.5">
      {/* Below lg the sidebar is a drawer. */}
      <Button
        type="button"
        variant="icon"
        size="md"
        fullWidth={false}
        onClick={openMobile}
        aria-label="Open menu"
        aria-controls={SIDEBAR_ID}
        aria-expanded={isMobileOpen}
        className="lg:hidden"
        icon={<Icon icon="TbMenu2" size={18} />}
      />
      <h1 className="min-w-0 truncate font-mono text-[13px] font-semibold text-text-bright">
        {title}
      </h1>

      <div className="flex-1" />

      <GlobalSearch />

      {/* <span className="relative hidden text-text-nav sm:flex">
        <Icon icon="TbBell" size={18} className="stroke-[1.5]" />
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-surface bg-danger" />
      </span> */}

      <DropdownMenu
        ariaLabel="Account"
        items={profileItems}
        header={profileHeader}
        size="md"
        className="min-w-60"
        trigger={({ toggle, isOpen }) => (
          <button
            type="button"
            onClick={toggle}
            aria-haspopup="menu"
            aria-expanded={isOpen}
            aria-label="Account menu"
            className="flex shrink-0 cursor-pointer items-center gap-2.5 border-l border-border-default pl-3 text-left sm:pl-3.5"
          >
            {user && (
              <Avatar
                name={user.name ?? ""}
                src={user.avatarUrl}
                size="lg"
                colorClass="bg-info/25 text-info-light"
              />
            )}
            <span className="hidden flex-col gap-px sm:flex">
              <span className="text-[12.5px] leading-tight font-semibold text-text-strong">
                {user?.name}
              </span>
              <span className="font-mono text-[10.5px] text-text-faint">
                {/* The user's role in the org being viewed. */}
                {membership?.role}
              </span>
            </span>
            <Icon
              icon="TbChevronDown"
              size={13}
              className="hidden shrink-0 text-text-muted sm:block"
            />
          </button>
        )}
      />
    </header>
  );
});

Navbar.displayName = "Navbar";

export default Navbar;
