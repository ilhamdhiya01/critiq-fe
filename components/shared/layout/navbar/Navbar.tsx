"use client";

import Image from "next/image";
import React from "react";

import Icon from "@/components/ui/icon/Icon";
import { getInitials } from "@/lib/helpers/avatar.helper";
import { useUser } from "@/lib/hooks/auth/useUser";

interface NavbarProps {
  title: string;
}

// Search, notifications and the profile menu are presentational for now —
// they render at the mockup's fidelity but carry no behaviour yet.
const Navbar = React.memo(({ title }: NavbarProps) => {
  const { data: user } = useUser();
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border-default bg-surface px-5.5">
      <h1 className="font-mono text-[13px] font-semibold text-text-bright">
        {title}
      </h1>

      <div className="flex-1" />

      <div className="flex w-70 items-center gap-2 rounded-[7px] border border-border-default bg-raised px-3 py-1.5">
        <Icon
          icon="TbSearch"
          size={14}
          className="shrink-0 stroke-[1.8] text-text-muted"
        />
        <span className="flex-1 truncate text-[12.5px] text-text-placeholder">
          Search repos, PRs, rules…
        </span>
        <span className="shrink-0 rounded border border-border-default px-1.5 font-mono text-[10px] text-text-placeholder">
          ⌘K
        </span>
      </div>

      <span className="relative flex text-text-nav">
        <Icon icon="TbBell" size={18} className="stroke-[1.5]" />
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-surface bg-danger" />
      </span>

      <div className="flex items-center gap-2.5 border-l border-border-default pl-3.5">
        {user && user.avatarUrl && (
          <Image
            alt="avatar"
            src={user.avatarUrl}
            width={30}
            height={30}
            className="rounded-full"
          />
        )}
        {user && !user.avatarUrl && (
          <span className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-full bg-info/25 text-[11px] font-bold text-info-light">
            {getInitials(user?.name ?? "")}
          </span>
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
      </div>
    </header>
  );
});

Navbar.displayName = "Navbar";

export default Navbar;
