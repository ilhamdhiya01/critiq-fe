import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

import { readPendingInvite } from "@/lib/helpers/invite.helper";
import { ROUTES } from "@/routes";

// sessionStorage has no change events within the same tab; reading it once
// per render is enough here.
const subscribe = () => () => {};

// After login, a user who started from an invite link goes back to it before
// anything else (e.g. before onboarding creates a new org). Returns true while
// that redirect is happening so the caller can render nothing.
export const usePendingInviteRedirect = (): boolean => {
  const router = useRouter();
  // null on the server, so hydration never mismatches.
  const token = useSyncExternalStore(subscribe, readPendingInvite, () => null);

  useEffect(() => {
    if (token) router.replace(ROUTES.invite(token));
  }, [token, router]);

  return !!token;
};
