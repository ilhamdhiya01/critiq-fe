import type { SegmentedOption } from "@/components/ui/segmented-control";
import type {
  InviteDeliveryStatus,
  InvitePreviewStatus,
  MemberRole,
} from "@/lib/types/member.types";

export const MEMBER_ROLE_OPTIONS: {
  value: MemberRole;
  label: string;
  description: string;
}[] = [
  {
    value: "admin",
    label: "ADMIN",
    description: "Kelola organisasi, anggota, dan integrasi.",
  },
  {
    value: "reviewer",
    label: "REVIEWER",
    description: "Review dan approve pull request.",
  },
  {
    value: "viewer",
    label: "VIEWER",
    description: "Lihat pull request dan hasil scan saja.",
  },
];

export const MEMBER_ROLE_LABEL: Record<MemberRole, string> = {
  admin: "ADMIN",
  reviewer: "REVIEWER",
  viewer: "VIEWER",
};

export const MEMBER_ROLE_SEGMENTS: SegmentedOption<MemberRole>[] =
  MEMBER_ROLE_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
    title: option.description,
    tone: "primary",
  }));

// Survives the OAuth round trip (same tab) so login returns to the invite.
export const PENDING_INVITE_STORAGE_KEY = "critiq.pendingInvite";

export const MEMBERS_ADMIN_ONLY_NOTE =
  "Only Admins can invite members or change roles in this organization.";

export const MEMBER_ERROR_MESSAGE: Record<string, string> = {
  already_member: "This person is already a member of the organization.",
  invite_pending: "An invitation for this email is already pending.",
  invite_rate_limited: "Too many invitations right now — try again later.",
  last_admin: "An organization needs at least one Admin.",
  forbidden: "Only Admins can manage members.",
};

export const INVITE_DELIVERY_LABEL: Record<InviteDeliveryStatus, string> = {
  pending: "Sending email…",
  sent: "Email sent",
  failed: "Email failed",
  not_configured: "Email not configured",
};

// Invite page: terminal states (and 410 accept errors) show no actions.
export const INVITE_STATUS_COPY: Record<
  Exclude<InvitePreviewStatus, "pending">,
  { title: string; body: string }
> = {
  expired: {
    title: "This invitation has expired",
    body: "Ask an Admin of the organization to send you a new one.",
  },
  revoked: {
    title: "This invitation was revoked",
    body: "Ask an Admin of the organization if you still need access.",
  },
  accepted: {
    title: "This invitation was already used",
    body: "Sign in to open the organization.",
  },
};

export const INVITE_ACCEPT_ERROR_STATUS: Record<
  string,
  Exclude<InvitePreviewStatus, "pending">
> = {
  invite_expired: "expired",
  invite_revoked: "revoked",
  invite_used: "accepted",
};
