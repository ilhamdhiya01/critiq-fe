import { redirect } from "next/navigation";

import { Organisation } from "@/components/features/organisation";
import { getUserFromToken } from "@/lib/helpers";
import { ROUTES } from "@/routes";

const RootPage = async () => {
  const userData = await getUserFromToken();

  // proxy.ts already rejects anonymous requests, so this never fires at
  // runtime — but getUserFromToken() is typed `DecodedToken | null` and the
  // access below does not compile without narrowing it here.
  if (!userData) redirect(ROUTES.LOGIN);

  // Not redundant with proxy.ts: that guard is `activeOrgId === null`, so a
  // token carrying "" or an absent claim slips past it. `!` catches those too.
  if (!userData.activeOrgId) redirect(ROUTES.SETUP);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Organisation.OrganisationRedirect activeOrgId={userData.activeOrgId} />
    </div>
  );
};

export default RootPage;
