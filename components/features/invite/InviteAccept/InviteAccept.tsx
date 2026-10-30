"use client";

import React, { useCallback, useEffect, useState } from "react";

import Logo from "@/components/shared/logo";
import OAuthButtons from "@/components/shared/oauth-buttons";
import Avatar from "@/components/ui/avatar";
import Button from "@/components/ui/button";
import Skeleton from "@/components/ui/skeleton";
import { INVITE_STATUS_COPY, MEMBER_ROLE_LABEL } from "@/const/member.constant";
import { formatDate } from "@/lib/helpers/date.helper";
import {
  clearPendingInvite,
  savePendingInvite,
} from "@/lib/helpers/invite.helper";
import { useLogout } from "@/lib/hooks/auth/useLogout";
import { useUser } from "@/lib/hooks/auth/useUser";
import { useAcceptInvite } from "@/lib/hooks/members/useAcceptInvite";
import { useInvitePreview } from "@/lib/hooks/members/useInvitePreview";
import { ROUTES } from "@/routes";

interface InviteAcceptProps {
  token: string;
}

const Title = ({ children }: { children: React.ReactNode }) => (
  <h1 className="mt-7 text-[22px] font-semibold tracking-[-.01em] text-neutral-50">
    {children}
  </h1>
);

const Message = ({ title, body }: { title: string; body: string }) => (
  <>
    <Title>{title}</Title>
    <p className="mt-2 text-[13px] leading-normal text-text-secondary">
      {body}
    </p>
    <Button link={ROUTES.ROOT} variant="secondary" size="md" className="mt-6">
      Go to Critiq
    </Button>
  </>
);

// Public page: works signed out (sign in first) and signed in (accept). The
// active account is always shown, so an Admin who opens their own link
// doesn't accept it by accident.
const InviteAccept = React.memo(({ token }: InviteAcceptProps) => {
  const {
    data: invite,
    isLoading: isLoadingInvite,
    isError,
    isNotFound,
  } = useInvitePreview(token);
  const {
    data: user,
    isPending: isCheckingUser,
    isError: isUserError,
  } = useUser();
  const { handleAccept, isAccepting, failedStatus, isAlreadyMember } =
    useAcceptInvite(token);
  const { handleLogout, isLoggingOut } = useLogout();
  // Set right after "Sign out" so the login buttons show without waiting
  // for /auth/me to fail.
  const [hasSignedOut, setHasSignedOut] = useState(false);

  const isPending = invite?.status === "pending" && !failedStatus;
  const isSignedOut = isUserError || hasSignedOut;
  const signedInUser = hasSignedOut ? undefined : user;

  // Remember the invite across the OAuth round trip (same tab), so login
  // comes back here instead of onboarding.
  useEffect(() => {
    if (isPending && isSignedOut) savePendingInvite(token);
  }, [isPending, isSignedOut, token]);

  // A dead invite (unknown, expired, revoked, used) must not keep pulling the
  // user back here after login.
  const isDeadInvite = isNotFound || (!!invite && invite.status !== "pending");
  useEffect(() => {
    if (isDeadInvite) clearPendingInvite();
  }, [isDeadInvite]);

  // "Not you?": end this session but keep the invite for the next login.
  const handleSignOut = useCallback(async () => {
    try {
      await handleLogout();
      savePendingInvite(token);
      setHasSignedOut(true);
    } catch {
      // Toasted in useLogout; still signed in.
    }
  }, [handleLogout, token]);

  const renderBody = () => {
    if (isLoadingInvite || (isPending && isCheckingUser && !hasSignedOut)) {
      return (
        <div className="mt-7 flex flex-col gap-3">
          <Skeleton className="h-6 w-3/4 rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="mt-3 h-10 w-full rounded-md" />
        </div>
      );
    }

    if (isNotFound || isError || !invite) {
      return (
        <Message
          title="This invitation link isn't valid"
          body="Check the link, or ask an Admin of the organization for a new invitation."
        />
      );
    }

    const terminal =
      failedStatus ?? (invite.status === "pending" ? null : invite.status);
    if (terminal) return <Message {...INVITE_STATUS_COPY[terminal]} />;

    const { name: orgName, slug: orgSlug } = invite.organization;

    // Accepting with an account that's already in the org didn't use the
    // invite — it's still there for the person it was meant for.
    if (isAlreadyMember && signedInUser) {
      return (
        <>
          <Title>You&apos;re already a member</Title>
          <p className="mt-2 text-[13px] leading-normal text-text-secondary">
            You&apos;re already a member of{" "}
            <span className="font-semibold text-neutral-100">{orgName}</span> as{" "}
            {signedInUser.name}. This invitation is still valid for someone
            else.
          </p>
          <div className="mt-7 flex flex-col gap-2.5">
            <Button
              link={ROUTES.dashboard(orgSlug)}
              variant="primary"
              size="md"
              className="py-2.75"
              onClick={clearPendingInvite}
            >
              Go to {orgName}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="py-2.75"
              onClick={handleSignOut}
              isLoading={isLoggingOut}
              disabled={isLoggingOut}
            >
              Sign out to accept with another account
            </Button>
          </div>
        </>
      );
    }

    return (
      <>
        <Title>Join {orgName}</Title>
        <p className="mt-2 text-[13px] leading-normal text-text-secondary">
          {invite.invitedBy?.name ?? "An Admin"} invited you to join{" "}
          <span className="font-semibold text-neutral-100">{orgName}</span> as{" "}
          <span className="font-mono text-neutral-100">
            {MEMBER_ROLE_LABEL[invite.role]}
          </span>
          .
        </p>
        <p className="mt-1 text-[11.5px] text-text-faint">
          Invited as <span className="font-mono break-all">{invite.email}</span>{" "}
          · expires {formatDate(invite.expiresAt)}
        </p>

        {signedInUser ? (
          <>
            <div className="mt-6 flex items-center gap-3 rounded-lg border border-border-default bg-raised px-3.5 py-3">
              <Avatar
                name={signedInUser.name}
                src={signedInUser.avatarUrl}
                size="lg"
              />
              <span className="min-w-0 text-[12.5px] leading-normal text-text-nav">
                Signed in as{" "}
                <span className="font-semibold text-neutral-100">
                  {signedInUser.name}
                </span>{" "}
                <span className="break-all text-text-muted">
                  ({signedInUser.email})
                </span>
              </span>
            </div>
            <Button
              type="button"
              variant="primary"
              size="md"
              className="mt-4 py-2.75"
              onClick={() => handleAccept()}
              isLoading={isAccepting}
              disabled={isAccepting || isLoggingOut}
            >
              Accept invitation
            </Button>
            <p className="mt-3 text-center text-[12px] text-text-muted">
              Not you?{" "}
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className="cursor-pointer text-primary-300 hover:underline disabled:cursor-wait disabled:opacity-60"
              >
                Sign out
              </button>
            </p>
          </>
        ) : (
          <>
            <p className="mt-7 text-xs text-text-muted">
              Sign in to accept the invitation.
            </p>
            <OAuthButtons verb="Sign in with" className="mt-3" />
          </>
        )}
      </>
    );
  };

  return (
    <>
      <Logo size={30} withWordmark />
      {renderBody()}
    </>
  );
});

InviteAccept.displayName = "InviteAccept";

export default InviteAccept;
