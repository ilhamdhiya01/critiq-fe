import classNames from "classnames";
import React from "react";

import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon/Icon";
import {
  INVITE_DELIVERY_LABEL,
  MEMBER_ROLE_LABEL,
} from "@/const/member.constant";
import { getDaysUntil } from "@/lib/helpers/date.helper";
import type { OrgInvite } from "@/lib/types/member.types";

interface InviteRowProps {
  invite: OrgInvite;
  isResending: boolean;
  isRevoking: boolean;
  onResend: (inviteId: string) => void;
  onRevoke: (inviteId: string) => void;
}

const formatExpiry = (expiresAt: string): string => {
  const days = getDaysUntil(expiresAt);
  if (days < 0) return "expired";
  if (days === 0) return "expires today";
  return `expires in ${days} day${days === 1 ? "" : "s"}`;
};

const InviteRow = React.memo(
  ({ invite, isResending, isRevoking, onResend, onRevoke }: InviteRowProps) => {
    const isDeliveryProblem =
      invite.delivery.status === "failed" ||
      invite.delivery.status === "not_configured";

    return (
      <div className="flex flex-wrap items-center gap-3 py-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-raised text-text-secondary">
          <Icon icon="TbMail" size={14} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center gap-2">
            <span className="truncate font-mono text-[12.5px] text-neutral-100">
              {invite.email}
            </span>
            <Badge tone="neutral" weight="normal">
              Invited
            </Badge>
          </span>
          <span className="text-[11px] text-text-muted">
            {formatExpiry(invite.expiresAt)} ·{" "}
            <span
              title={invite.delivery.error ?? undefined}
              className={classNames({
                "text-warning-light": isDeliveryProblem,
              })}
            >
              {INVITE_DELIVERY_LABEL[invite.delivery.status]}
            </span>
          </span>
        </span>
        <Badge tone="neutral" size="md" weight="normal">
          {MEMBER_ROLE_LABEL[invite.role]}
        </Badge>
        <span className="flex gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            fullWidth={false}
            onClick={() => onResend(invite.id)}
            isLoading={isResending}
            disabled={isResending || isRevoking}
          >
            Resend
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            fullWidth={false}
            onClick={() => onRevoke(invite.id)}
            isLoading={isRevoking}
            disabled={isResending || isRevoking}
            className="hover:text-danger-light"
          >
            Revoke
          </Button>
        </span>
      </div>
    );
  },
);

InviteRow.displayName = "InviteRow";

export default InviteRow;
