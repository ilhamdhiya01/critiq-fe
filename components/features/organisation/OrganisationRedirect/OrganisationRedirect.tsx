"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

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
      return (
        <div className="flex flex-col items-center gap-4">
          <Logo size={32} />
          <p className="text-sm text-text-secondary">
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
