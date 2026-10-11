import classNames from "classnames";
import React from "react";

import Badge from "@/components/ui/badge";
import type {
  AiProviderId,
  AiProviderOption,
} from "@/lib/types/ai-settings.types";

interface ProviderPickerProps {
  providers: AiProviderOption[];
  selected: AiProviderId | null;
  onSelect: (id: AiProviderId) => void;
}

const ProviderPicker = React.memo(
  ({ providers, selected, onSelect }: ProviderPickerProps) => {
    return (
      <div className="flex flex-wrap gap-2">
        {providers.map((provider) => {
          const isSelected = provider.id === selected;
          const isDisabled = !provider.available;

          return (
            <button
              key={provider.id}
              type="button"
              aria-pressed={isSelected}
              disabled={isDisabled}
              title={isDisabled ? "Segera tersedia" : undefined}
              onClick={() => onSelect(provider.id)}
              className={classNames(
                "flex items-center gap-2 rounded-md border px-3 py-1.75 text-xs font-semibold transition-colors",
                {
                  "cursor-default border-primary-500/50 bg-primary-500/16 text-primary-200":
                    isSelected,
                  "cursor-pointer border-border-default bg-raised text-neutral-300 hover:bg-raised-alt":
                    !isSelected && !isDisabled,
                  "cursor-not-allowed border-border-default bg-raised text-neutral-300 opacity-45":
                    isDisabled,
                },
              )}
            >
              {provider.label}
              {isDisabled && <Badge>SEGERA</Badge>}
            </button>
          );
        })}
      </div>
    );
  },
);

ProviderPicker.displayName = "ProviderPicker";

export default ProviderPicker;
