"use client";

import { useParams } from "next/navigation";
import React, { useCallback, useState } from "react";

import SectionMessage from "@/components/shared/section-message";
import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon/Icon";
import Modal from "@/components/ui/modal";
import Skeleton from "@/components/ui/skeleton";
import { MEMBERS_ADMIN_ONLY_NOTE } from "@/const/member.constant";
import { useChangeMemberRole } from "@/lib/hooks/members/useChangeMemberRole";
import { useInviteMember } from "@/lib/hooks/members/useInviteMember";
import { useMembers } from "@/lib/hooks/members/useMembers";
import { useRemoveMember } from "@/lib/hooks/members/useRemoveMember";
import { useRevokeInvite } from "@/lib/hooks/members/useRevokeInvite";
import { useOrgBySlug } from "@/lib/hooks/organisation/useOrgBySlug";
import type { MemberRole, OrgMember } from "@/lib/types/member.types";

import InviteForm from "./InviteForm";
import InviteLinkModal from "./InviteLinkModal";
import InviteRow from "./InviteRow";
import MemberRow from "./MemberRow";

interface MembersCardProps {
  orgId?: string;
}

const MembersCard = React.memo(({ orgId = "" }: MembersCardProps) => {
  const { slug } = useParams<{ slug: string }>();
  const { membership } = useOrgBySlug(slug);
  // Every write is Admin-only; the BE refuses the rest with 403 anyway.
  const isAdmin = membership?.role === "ADMIN";

  const { data, isLoading, isError } = useMembers(orgId);
  const {
    handleInvite,
    handleResend,
    isInviting,
    isResending,
    resendingId,
    inviteError,
    inviteResult,
    clearResult,
    clearError,
  } = useInviteMember(orgId);
  const { handleRevoke, revokingId } = useRevokeInvite(orgId);
  const { handleChangeRole } = useChangeMemberRole(orgId);
  const { handleRemove, isRemoving } = useRemoveMember(orgId);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<OrgMember | null>(null);

  const toggleInvite = () => {
    setIsInviteOpen((current) => !current);
    clearError();
  };
  const closeInvite = useCallback(() => setIsInviteOpen(false), []);

  const onChangeRole = useCallback(
    (userId: string, role: MemberRole) => handleChangeRole({ userId, role }),
    [handleChangeRole],
  );
  const onRequestRemove = useCallback(
    (member: OrgMember) => setMemberToRemove(member),
    [],
  );
  const onResendRow = useCallback(
    (inviteId: string) => {
      handleResend(inviteId).catch(() => undefined);
    },
    [handleResend],
  );
  const onRevokeRow = useCallback(
    (inviteId: string) => handleRevoke(inviteId),
    [handleRevoke],
  );

  const confirmRemove = async () => {
    if (!memberToRemove) return;
    try {
      await handleRemove(memberToRemove);
    } finally {
      setMemberToRemove(null);
    }
  };

  const renderBody = () => {
    if (isError) {
      return (
        <SectionMessage tone="danger">
          Couldn&apos;t load members.
        </SectionMessage>
      );
    }
    if (isLoading || !data) {
      return (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-9 rounded-md" />
          ))}
        </div>
      );
    }

    return (
      <div className="flex flex-col divide-y divide-border-row">
        {data.members.map((member) => (
          <MemberRow
            key={member.userId}
            member={member}
            isAdmin={isAdmin}
            onChangeRole={onChangeRole}
            onRequestRemove={onRequestRemove}
          />
        ))}
        {isAdmin &&
          data.invites?.map((invite) => (
            <InviteRow
              key={invite.id}
              invite={invite}
              isResending={resendingId === invite.id}
              isRevoking={revokingId === invite.id}
              onResend={onResendRow}
              onRevoke={onRevokeRow}
            />
          ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[13px] font-semibold text-text-strong">
          Members{data ? ` (${data.members.length})` : ""}
        </span>
        {isAdmin && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            fullWidth={false}
            onClick={toggleInvite}
            aria-expanded={isInviteOpen}
            icon={<Icon icon="TbUserPlus" size={13} />}
            className="gap-1.5 font-mono"
          >
            Invite member
          </Button>
        )}
      </div>

      {isAdmin && isInviteOpen && (
        <InviteForm
          invites={data?.invites ?? null}
          onInvite={handleInvite}
          onResend={handleResend}
          isSubmitting={isInviting || isResending}
          error={inviteError}
          onDone={closeInvite}
        />
      )}

      {renderBody()}

      {!isAdmin && (
        <p className="text-[11.5px] text-text-faint">
          {MEMBERS_ADMIN_ONLY_NOTE}
        </p>
      )}

      <InviteLinkModal result={inviteResult} onClose={clearResult} />

      <Modal
        isOpen={!!memberToRemove}
        title={memberToRemove?.isYou ? "Leave organization?" : "Remove member?"}
        onClose={() => setMemberToRemove(null)}
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              fullWidth={false}
              onClick={() => setMemberToRemove(null)}
              disabled={isRemoving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              fullWidth={false}
              onClick={confirmRemove}
              isLoading={isRemoving}
              disabled={isRemoving}
            >
              {memberToRemove?.isYou ? "Leave" : "Remove"}
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-normal text-text-nav">
          {memberToRemove?.isYou
            ? "You'll lose access to this organization right away."
            : `${memberToRemove?.name ?? "This member"} will lose access to this organization right away.`}
        </p>
      </Modal>
    </div>
  );
});

MembersCard.displayName = "MembersCard";

export default MembersCard;
