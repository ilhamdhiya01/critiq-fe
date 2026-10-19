"use client";

import React, { useEffect, useState } from "react";

import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon/Icon";
import Input from "@/components/ui/input";
import Modal from "@/components/ui/modal";
import Notice from "@/components/ui/notice";
import { MEMBER_ROLE_LABEL } from "@/const/member.constant";
import type { InviteResult } from "@/lib/types/member.types";

const COPIED_RESET_MS = 2000;

interface InviteLinkModalProps {
  // null closes the modal; the link is gone once it closes.
  result: InviteResult | null;
  onClose: () => void;
}

const DeliveryNote = ({ result }: { result: InviteResult }) => {
  const { email, delivery } = result.invite;

  switch (delivery.status) {
    case "not_configured":
      return (
        <Notice tone="warning">
          Email isn&apos;t configured, share this link manually.
        </Notice>
      );
    case "failed":
      return (
        <Notice tone="warning">
          The email couldn&apos;t be sent, share this link manually.
        </Notice>
      );
    case "sent":
      return (
        <p className="text-[12.5px] text-text-nav">Email sent to {email}.</p>
      );
    default:
      return (
        <p className="text-[12.5px] text-text-nav">
          We&apos;re emailing {email} in the background.
        </p>
      );
  }
};

// Shows the invite link once — the BE never returns it again.
const InviteLinkModal = React.memo(
  ({ result, onClose }: InviteLinkModalProps) => {
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
      if (!isCopied) return;
      const timer = setTimeout(() => setIsCopied(false), COPIED_RESET_MS);
      return () => clearTimeout(timer);
    }, [isCopied]);

    if (!result) return null;

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(result.inviteUrl);
        setIsCopied(true);
      } catch {
        // Clipboard blocked: the link stays selectable in the field.
      }
    };

    return (
      <Modal
        isOpen
        title="Invitation sent"
        onClose={onClose}
        footer={
          <Button
            type="button"
            variant="primary"
            size="sm"
            fullWidth={false}
            onClick={onClose}
          >
            Done
          </Button>
        }
      >
        <div className="flex flex-col gap-3.5">
          <p className="text-[13px] text-text-strong">
            Invitation for{" "}
            <span className="font-mono">{result.invite.email}</span> as{" "}
            <span className="font-mono">
              {MEMBER_ROLE_LABEL[result.invite.role]}
            </span>
            .
          </p>
          <DeliveryNote result={result} />
          <div className="flex gap-2.5">
            <Input
              readOnly
              value={result.inviteUrl}
              aria-label="Invite link"
              onFocus={(event) => event.target.select()}
              className="font-mono text-[12px]"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              fullWidth={false}
              onClick={handleCopy}
              icon={<Icon icon={isCopied ? "TbCheck" : "TbCopy"} size={13} />}
              className="shrink-0"
            >
              {isCopied ? "Copied" : "Copy"}
            </Button>
          </div>
          <p className="text-[11.5px] text-text-faint">
            This link is shown only once.
          </p>
        </div>
      </Modal>
    );
  },
);

InviteLinkModal.displayName = "InviteLinkModal";

export default InviteLinkModal;
