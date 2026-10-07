import React from "react";

import Input from "@/components/ui/input";
import type { AiCredentialStatus } from "@/lib/types/ai-settings.types";

interface ApiKeyFieldProps {
  value: string;
  credential: AiCredentialStatus | undefined;
  isKeyOptional: boolean;
  canDeleteKey: boolean;
  error?: string;
  onChange: (value: string) => void;
  onDeleteKey: () => void;
}

const getPlaceholder = (
  credential: AiCredentialStatus | undefined,
  isKeyOptional: boolean,
): string => {
  if (credential?.hasKey) {
    return `Tersimpan (…${credential.last4}) — isi untuk mengganti`;
  }
  return isKeyOptional ? "Opsional" : "Tempel API key";
};

const ApiKeyField = React.memo(
  ({
    value,
    credential,
    isKeyOptional,
    canDeleteKey,
    error,
    onChange,
    onDeleteKey,
  }: ApiKeyFieldProps) => {
    return (
      <>
        <div className="flex items-center gap-2.5 text-[11.5px]">
          {credential?.hasKey ? (
            <>
              <span className="text-success-light">
                Key tersimpan · …{credential.last4}
              </span>
              {canDeleteKey && (
                <button
                  type="button"
                  onClick={onDeleteKey}
                  className="cursor-pointer text-danger-light hover:text-danger-light/80"
                >
                  Hapus key
                </button>
              )}
            </>
          ) : (
            <span className="text-text-secondary">
              Belum ada key untuk provider ini
            </span>
          )}
        </div>
        <Input
          type="password"
          autoComplete="new-password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={getPlaceholder(credential, isKeyOptional)}
          error={error}
          className="px-3 py-2.25 font-mono text-xs"
        />
      </>
    );
  },
);

ApiKeyField.displayName = "ApiKeyField";

export default ApiKeyField;
