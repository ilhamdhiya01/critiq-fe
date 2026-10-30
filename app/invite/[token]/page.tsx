import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Auth } from "@/components/features/auth";
import { Invite } from "@/components/features/invite";
import { isInviteToken } from "@/lib/helpers/id.helper";

export const metadata: Metadata = {
  title: "Invitation · Critiq",
};

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

const InvitePage = async ({ params }: InvitePageProps) => {
  const { token } = await params;
  // The token goes into the preview and accept paths.
  if (!isInviteToken(token)) notFound();

  return (
    <Auth.AuthLayout>
      <Invite.InviteAccept token={token} />
    </Auth.AuthLayout>
  );
};

export default InvitePage;
