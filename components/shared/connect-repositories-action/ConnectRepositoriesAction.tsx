"use client";

import React, { useCallback, useState } from "react";

import ConnectRepositoriesModal from "@/components/shared/connect-repositories-modal";
import Button from "@/components/ui/button";
import type { IntegrationProvider } from "@/lib/types/integration.types";

interface ConnectRepositoriesActionProps {
  orgId: string;
  provider: IntegrationProvider;
  label: string;
  variant: "secondary" | "ghost";
  disabled?: boolean;
  // Explains a disabled button (native tooltip).
  title?: string;
}

const ConnectRepositoriesAction = React.memo(
  ({
    orgId,
    provider,
    label,
    variant,
    disabled = false,
    title,
  }: ConnectRepositoriesActionProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleClose = useCallback(() => setIsOpen(false), []);

    return (
      <>
        <Button
          type="button"
          variant={variant}
          size="sm"
          fullWidth={false}
          disabled={disabled}
          title={title}
          onClick={() => setIsOpen(true)}
        >
          {label}
        </Button>
        {isOpen && (
          <ConnectRepositoriesModal
            orgId={orgId}
            provider={provider}
            onClose={handleClose}
          />
        )}
      </>
    );
  },
);

ConnectRepositoriesAction.displayName = "ConnectRepositoriesAction";

export default ConnectRepositoriesAction;
