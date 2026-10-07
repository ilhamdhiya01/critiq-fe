"use client";

import classNames from "classnames";
import React, { useCallback, useState } from "react";

import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon/Icon";
import Input from "@/components/ui/input";

type MemberRole = "ADMIN" | "REVIEWER" | "VIEWER";

interface Member {
  id: string;
  name: string;
  avatarColor: string;
  role: MemberRole;
  isPending: boolean;
  isCurrentUser: boolean;
}

const ROLE_OPTIONS: { value: MemberRole; description: string }[] = [
  { value: "ADMIN", description: "Kelola organisasi, anggota, dan integrasi." },
  { value: "REVIEWER", description: "Review dan approve pull request." },
  { value: "VIEWER", description: "Lihat pull request dan hasil scan saja." },
];

const INITIAL_MEMBERS: Member[] = [
  {
    id: "1",
    name: "Alex Winter",
    avatarColor: "bg-info/25 text-info-light",
    role: "ADMIN",
    isPending: false,
    isCurrentUser: true,
  },
  {
    id: "2",
    name: "Maya Okonkwo",
    avatarColor: "bg-primary-800/40 text-primary-200",
    role: "REVIEWER",
    isPending: false,
    isCurrentUser: false,
  },
  {
    id: "3",
    name: "Dan Herrera",
    avatarColor: "bg-primary-500/20 text-primary-300",
    role: "REVIEWER",
    isPending: false,
    isCurrentUser: false,
  },
  {
    id: "4",
    name: "Priya Natarajan",
    avatarColor: "bg-success/20 text-success-light",
    role: "REVIEWER",
    isPending: false,
    isCurrentUser: false,
  },
  {
    id: "5",
    name: "Tom Alvey",
    avatarColor: "bg-warning/20 text-warning-light",
    role: "VIEWER",
    isPending: false,
    isCurrentUser: false,
  },
];

const getInitials = (name: string): string =>
  name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

interface RoleDropdownProps {
  member: Member;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (role: MemberRole) => void;
}

const RoleDropdown = React.memo(
  ({ member, isOpen, onToggle, onSelect }: RoleDropdownProps) => {
    const handleSelect = useCallback(
      (role: MemberRole) => {
        onSelect(role);
      },
      [onSelect],
    );

    return (
      <div className="relative">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          fullWidth={false}
          onClick={onToggle}
          className="gap-1.5 bg-raised px-2.5 py-1 font-mono text-[11px] hover:bg-raised-alt"
        >
          {member.role}
          <Icon icon="TbChevronDown" size={12} />
        </Button>

        {isOpen && (
          <div className="absolute top-full right-0 z-10 mt-1.5 w-56 rounded-lg border border-border-default bg-raised-alt py-1.5 shadow-lg">
            {ROLE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className="flex w-full flex-col gap-0.5 px-3 py-2 text-left hover:bg-surface-hover"
              >
                <span className="flex items-center gap-1.5 font-mono text-[11.5px] text-neutral-100">
                  {member.role === option.value && (
                    <Icon icon="TbCheck" size={12} className="text-success" />
                  )}
                  {option.value}
                </span>
                <span className="text-[10.5px] text-text-faint">
                  {option.description}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  },
);

RoleDropdown.displayName = "RoleDropdown";

const MembersCard = React.memo(() => {
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [openMemberId, setOpenMemberId] = useState<string | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("REVIEWER");

  const handleToggleInvite = useCallback(
    () => setIsInviteOpen((current) => !current),
    [],
  );

  const handleToggleDropdown = useCallback((memberId: string) => {
    setOpenMemberId((current) => (current === memberId ? null : memberId));
  }, []);

  const handleSelectRole = useCallback((memberId: string, role: MemberRole) => {
    setMembers((current) =>
      current.map((member) =>
        member.id === memberId ? { ...member, role } : member,
      ),
    );
    setOpenMemberId(null);
  }, []);

  const handleSendInvite = useCallback(() => {
    if (!inviteEmail.trim()) return;
    setMembers((current) => [
      ...current,
      {
        id: `${Date.now()}`,
        name: inviteEmail.trim(),
        avatarColor: "bg-raised-alt text-text-secondary",
        role: inviteRole,
        isPending: true,
        isCurrentUser: false,
      },
    ]);
    setInviteEmail("");
    setInviteRole("REVIEWER");
    setIsInviteOpen(false);
  }, [inviteEmail, inviteRole]);

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[13px] font-semibold text-text-strong">
          Members ({members.length})
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          fullWidth={false}
          onClick={handleToggleInvite}
          icon={<Icon icon="TbUserPlus" size={13} />}
          className="gap-1.5 font-mono"
        >
          Invite member
        </Button>
      </div>

      {isInviteOpen && (
        <div className="flex flex-col gap-3 rounded-md border border-border-default bg-raised p-3.5">
          <Input
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="nama@perusahaan.com"
            className="font-mono text-[12.5px]"
          />
          <div className="flex gap-2">
            {ROLE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setInviteRole(option.value)}
                className={classNames(
                  "flex-1 cursor-pointer rounded-md border px-2.5 py-1.5 font-mono text-[11px] font-semibold",
                  inviteRole === option.value
                    ? "border-primary-500/45 bg-primary-500/12 text-primary-300"
                    : "border-border-default text-text-secondary hover:bg-raised-alt",
                )}
              >
                {option.value}
              </button>
            ))}
          </div>
          <Button
            variant="primary"
            size="sm"
            fullWidth={false}
            onClick={handleSendInvite}
            disabled={!inviteEmail.trim()}
          >
            Send invite
          </Button>
        </div>
      )}

      <div className="flex flex-col divide-y divide-border-row">
        {members.map((member) => (
          <div key={member.id} className="flex items-center gap-3 py-2.5">
            <span
              className={classNames(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold",
                member.avatarColor,
              )}
            >
              {getInitials(member.name)}
            </span>
            <span className="flex-1 truncate text-[12.5px] text-neutral-100">
              {member.name}
            </span>
            {member.isPending && (
              <span className="rounded-full border border-border-default bg-raised px-2 py-0.5 font-mono text-[10px] text-text-secondary">
                INVITED
              </span>
            )}
            {member.isCurrentUser ? (
              <span className="rounded-full border border-border-default bg-raised px-2.5 py-1 font-mono text-[11px] text-text-secondary">
                {member.role}
              </span>
            ) : (
              <RoleDropdown
                member={member}
                isOpen={openMemberId === member.id}
                onToggle={() => handleToggleDropdown(member.id)}
                onSelect={(role) => handleSelectRole(member.id, role)}
              />
            )}
          </div>
        ))}
      </div>

      <p className="text-[11.5px] text-text-faint">
        Only Admins can invite members or change roles in this organization.
      </p>
    </div>
  );
});

MembersCard.displayName = "MembersCard";

export default MembersCard;
