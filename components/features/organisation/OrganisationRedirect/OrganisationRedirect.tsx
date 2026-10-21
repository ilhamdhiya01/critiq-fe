"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import Logo from "@/components/shared/logo";
import StateStatus from "@/components/shared/state-status";
import Button from "@/components/ui/button";
import { readLastOrgSlug } from "@/lib/helpers/last-org.helper";
import { pickLandingMembership } from "@/lib/helpers/organization.helper";
import { useMemberships } from "@/lib/hooks/organisation/useMemberships";
import { usePendingInviteRedirect } from "@/lib/hooks/usePendingInviteRedirect";
import { ROUTES } from "@/routes";

// `/` carries no UI of its own — it works out which organization the user
// belongs to and forwards to `/<slug>`.
//
// This runs in the browser rather than on the server: the session cookie and
// the API origin are both already there, so no extra configuration is needed.
// Resolving it server-side would mean a second, absolute API origin plus its
// own TLS trust setup, for a screen that is only ever shown in passing.
const OrganisationRedirect = React.memo(() => {
  const router = useRouter();
  // A pending invite (started before login) wins over the usual landing.
  const isGoingToInvite = usePendingInviteRedirect();

  // Anti-flash window (matches the "App boot" mockup): a resolve that
  // finishes within 300ms never shows the loading UI at all.
  const [showBoot, setShowBoot] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowBoot(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const { data: memberships, isPending, isError } = useMemberships();

  // The last org opened, else the first finished one, else the first. Not
  // the session's active org: that only changes when the BE re-issues it.
  const landing = memberships
    ? pickLandingMembership(memberships, readLastOrgSlug())
    : null;
  const organisation = landing?.organization;
  const hasNoOrg = !!memberships && memberships.length === 0;

  useEffect(() => {
    if (isGoingToInvite) return;
    if (landing) router.replace(ROUTES.dashboard(landing.organization.slug));
    else if (hasNoOrg) router.replace(ROUTES.SETUP);
  }, [landing, hasNoOrg, router, isGoingToInvite]);

  if (isGoingToInvite) return null;

  if (isPending || organisation || (hasNoOrg && !isError)) {
    if (!showBoot) return null;

    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background">
        <Logo size={32} withWordmark />
        <svg
          width={18}
          height={18}
          viewBox="0 0 24 24"
          className="animate-spin"
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-neutral-700"
            fill="none"
          />
          <path
            d="M12 3a9 9 0 0 1 9 9"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="text-primary-300"
            fill="none"
          />
        </svg>
        <p className="font-mono text-[11.5px] text-text-muted">
          {organisation
            ? `Membuka ${organisation.name}…`
            : "Menyiapkan organisasi kamu…"}
        </p>
      </div>
    );
  }

  // The memberships request failed.
  return (
    <div className="w-full max-w-md">
      <StateStatus
        title="Gagal memuat organisasi"
        description="Coba muat ulang halaman. Kalau masih gagal, cek koneksi ke server."
        action={
          <Button link={ROUTES.ROOT} fullWidth={false} size="md">
            Muat ulang
          </Button>
        }
      />
    </div>
  );
});

OrganisationRedirect.displayName = "OrganisationRedirect";

export default OrganisationRedirect;
