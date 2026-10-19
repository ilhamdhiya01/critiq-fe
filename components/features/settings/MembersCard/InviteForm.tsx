"use client";

import React, { useState } from "react";

import Button from "@/components/ui/button";
import FieldError from "@/components/ui/field-error";
import Input from "@/components/ui/input";
import SegmentedControl from "@/components/ui/segmented-control";
import { MEMBER_ROLE_SEGMENTS } from "@/const/member.constant";
import type { MemberError } from "@/lib/hooks/members/memberError";
import type {
  InviteInput,
  MemberRole,
  OrgInvite,
} from "@/lib/types/member.types";

interface InviteFormProps {
  invites: OrgInvite[] | null;
  onInvite: (input: InviteInput) => Promise<unknown>;
  onResend: (inviteId: string) => Promise<unknown>;
  isSubmitting: boolean;
  error: MemberError | null;
  // Called after a successful invite or resend.
  onDone: () => void;
}

const InviteForm = React.memo(
  ({
    invites,
    onInvite,
    onResend,
    isSubmitting,
    error,
    onDone,
  }: InviteFormProps) => {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<MemberRole>("reviewer");
    const trimmed = email.trim();

    // `invite_pending`: offer to resend the invite that already exists.
    const pendingInvite =
      error?.code === "invite_pending"
        ? invites?.find(
            (invite) => invite.email.toLowerCase() === trimmed.toLowerCase(),
          )
        : undefined;

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!trimmed) return;
      try {
        await onInvite({ email: trimmed, role });
        setEmail("");
        setRole("reviewer");
        onDone();
      } catch {
        // `error` explains it below the field.
      }
    };

    const handleResend = async () => {
      if (!pendingInvite) return;
      try {
        await onResend(pendingInvite.id);
        setEmail("");
        onDone();
      } catch {
        // Shown via `error`.
      }
    };

    return (
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-md border border-border-default bg-raised p-3.5"
      >
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="nama@perusahaan.com"
          aria-label="Email"
          error={error ? error.message : undefined}
          className="font-mono text-[12.5px]"
        />
        <SegmentedControl
          size="sm"
          fullWidth
          options={MEMBER_ROLE_SEGMENTS}
          value={role}
          onChange={setRole}
          ariaLabel="Role for the invited member"
        />
        {error && (
          <FieldError className="flex-wrap">
            {error.message}
            {pendingInvite && (
              <button
                type="button"
                onClick={handleResend}
                className="cursor-pointer text-text-nav underline underline-offset-2 hover:text-text-strong"
              >
                Resend invite
              </button>
            )}
          </FieldError>
        )}
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!trimmed || isSubmitting}
          isLoading={isSubmitting}
        >
          Send invite
        </Button>
      </form>
    );
  },
);

InviteForm.displayName = "InviteForm";

export default InviteForm;
