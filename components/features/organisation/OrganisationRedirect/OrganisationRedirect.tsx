"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import Logo from "@/components/shared/logo";
import StateStatus from "@/components/shared/state-status";
import Button from "@/components/ui/button";
import { membershipWithOrgKeys } from "@/lib/hooks/integrations/queryKeys";
import { ROUTES } from "@/routes";
import { getMembershipWithOrg } from "@/services/membership-with-org.service";

interface OrganisationRedirectProps {
  activeOrgId: string;
}

// `/` carries no UI of its own — it works out which organization the user
// belongs to and forwards to `/<slug>`.
//
// This runs in the browser rather than on the server: the session cookie and
// the API origin are both already there, so no extra configuration is needed.
// Resolving it server-side would mean a second, absolute API origin plus its
// own TLS trust setup, for a screen that is only ever shown in passing.
const OrganisationRedirect = React.memo(
  ({ activeOrgId }: OrganisationRedirectProps) => {
    const router = useRouter();

    // Anti-flash window (matches the "App boot" mockup): a resolve that
    // finishes within 300ms never shows the loading UI at all.
    const [showBoot, setShowBoot] = useState(false);

    useEffect(() => {
      const timer = setTimeout(() => setShowBoot(true), 300);
      return () => clearTimeout(timer);
    }, []);

    const { data: memberships, isPending } = useQuery({
      queryKey: membershipWithOrgKeys.all,
      queryFn: getMembershipWithOrg,
      select: (response) => response.data ?? [],
      retry: false,
    });

    // Prefer the organization the session points at; fall back to the first
    // membership so a stale activeOrgId still lands somewhere usable.
    const organisation =
      memberships?.find((item) => item.organizationId === activeOrgId)
        ?.organization ?? memberships?.[0]?.organization;

    useEffect(() => {
      if (organisation) router.replace(ROUTES.dashboard(organisation.slug));
    }, [organisation, router]);

    if (isPending || organisation) {
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

    // Loaded, but nothing to open: no membership, or the request failed.
    return (
      <div className="w-full max-w-md">
        <StateStatus
          title="Belum ada organisasi"
          description="Akun kamu belum tergabung di organisasi mana pun. Buat satu lewat setup untuk mulai memakai Critiq."
          action={
            <Button link={ROUTES.SETUP} fullWidth={false} size="md">
              Buka setup
            </Button>
          }
        />
      </div>
    );
  },
);

OrganisationRedirect.displayName = "OrganisationRedirect";

export default OrganisationRedirect;
