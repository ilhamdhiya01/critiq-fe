import type { Metadata } from "next";

import { Auth } from "@/components/features/auth";
import { Invite } from "@/components/features/invite";

export const metadata: Metadata = {
  title: "Invitation · Critiq",
};

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

const InvitePage = async ({ params }: InvitePageProps) => {
  const { token } = await params;

  return (
    <Auth.AuthLayout>
      <Invite.InviteAccept token={token} />
    </Auth.AuthLayout>
  );
};

export default InvitePage;
