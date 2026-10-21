"use client";

import React, { useMemo } from "react";

import DropdownMenu from "@/components/shared/dropdown-menu";
import Avatar from "@/components/ui/avatar";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon/Icon";
import {
  MEMBER_ROLE_LABEL,
  MEMBER_ROLE_OPTIONS,
} from "@/const/member.constant";
import type { MemberRole, OrgMember } from "@/lib/types/member.types";

interface MemberRowProps {
  member: OrgMember;
  isAdmin: boolean;
  onChangeRole: (userId: string, role: MemberRole) => void;
  onRequestRemove: (member: OrgMember) => void;
}

const MemberRow = React.memo(
  ({ member, isAdmin, onChangeRole, onRequestRemove }: MemberRowProps) => {
    const roleItems = useMemo(
      () =>
        MEMBER_ROLE_OPTIONS.map((option) => ({
          key: option.value,
          label: option.label,
          description: option.description,
          checked: member.role === option.value,
          onSelect: () => {
            if (option.value !== member.role) {
              onChangeRole(member.userId, option.value);
            }
          },
        })),
      [member.role, member.userId, onChangeRole],
    );

    const actionItems = useMemo(
      () => [
        {
          key: "remove",
          label: member.isYou
            ? "Leave organization"
            : "Remove from organization",
          tone: "danger" as const,
          onSelect: () => onRequestRemove(member),
        },
      ],
      [member, onRequestRemove],
    );

    // Your own role stays a static badge (as in the mockup).
    const canChangeRole = isAdmin && !member.isYou;

    return (
      <div className="flex flex-wrap items-center gap-3 py-2.5">
        <Avatar
          name={member.name}
          src={member.avatarUrl}
          size="md"
          className="font-mono"
        />
        <span className="flex min-w-0 flex-1 basis-40 flex-col">
          <span className="truncate text-[12.5px] text-neutral-100">
            {member.name}
            {member.isYou && <span className="text-text-faint"> (you)</span>}
          </span>
          <span className="truncate text-[11px] text-text-muted">
            {member.email}
          </span>
        </span>

        {/* Stays together and drops under the name when the row is too narrow. */}
        <div className="ml-auto flex items-center gap-3">
          {canChangeRole ? (
            <DropdownMenu
              ariaLabel={`Role for ${member.name}`}
              items={roleItems}
              trigger={({ toggle, isOpen }) => (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  fullWidth={false}
                  onClick={toggle}
                  aria-haspopup="menu"
                  aria-expanded={isOpen}
                  aria-label={`Change role for ${member.name}`}
                  className="gap-1.5 bg-raised px-2.5 py-1 font-mono text-[11px] hover:bg-raised-alt"
                >
                  {MEMBER_ROLE_LABEL[member.role]}
                  <Icon icon="TbChevronDown" size={12} />
                </Button>
              )}
            />
          ) : (
            <Badge tone="neutral" size="md" weight="normal">
              {MEMBER_ROLE_LABEL[member.role]}
            </Badge>
          )}

          {isAdmin && (
            <DropdownMenu
              ariaLabel={`Actions for ${member.name}`}
              items={actionItems}
              trigger={({ toggle, isOpen }) => (
                <Button
                  type="button"
                  variant="icon"
                  size="sm"
                  fullWidth={false}
                  onClick={toggle}
                  aria-haspopup="menu"
                  aria-expanded={isOpen}
                  aria-label={`More actions for ${member.name}`}
                  icon={<Icon icon="TbDots" size={15} />}
                />
              )}
            />
          )}
        </div>
      </div>
    );
  },
);

MemberRow.displayName = "MemberRow";

export default MemberRow;
