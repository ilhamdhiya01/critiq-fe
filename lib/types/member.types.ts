export type MemberRole = "admin" | "reviewer" | "viewer";

export interface OrgMember {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: MemberRole;
  joinedAt: string;
  isYou: boolean;
}

export type InviteDeliveryStatus =
  "pending" | "sent" | "failed" | "not_configured";

export interface OrgInvite {
  id: string;
  email: string;
  role: MemberRole;
  invitedBy: { id: string; name: string } | null;
  createdAt: string;
  expiresAt: string;
  delivery: { status: InviteDeliveryStatus; error: string | null };
}

export interface MembersData {
  members: OrgMember[];
  // null for non-Admins.
  invites: OrgInvite[] | null;
}

// `inviteUrl` is returned only here (create / resend) — never cache it.
export interface InviteResult {
  invite: OrgInvite;
  inviteUrl: string;
}

export interface InviteInput {
  email: string;
  role: MemberRole;
}

export type InvitePreviewStatus =
  "pending" | "expired" | "revoked" | "accepted";

export interface InvitePreview {
  organization: { name: string; slug: string };
  invitedBy: { name: string } | null;
  role: MemberRole;
  // Already masked by the BE, e.g. "ka***@perusahaan.com".
  email: string;
  expiresAt: string;
  status: InvitePreviewStatus;
}

export interface AcceptInviteResult {
  organization: { id: string; name: string; slug: string };
  role: MemberRole;
}
