import classNames from "classnames";
import React from "react";

import { AI_LOCALE_OPTIONS } from "@/const/ai-settings.constant";
import type { AiLocale } from "@/lib/types/ai-settings.types";

interface LocaleToggleProps {
  value: AiLocale;
  onChange: (value: AiLocale) => void;
}

const LocaleToggle = React.memo(({ value, onChange }: LocaleToggleProps) => {
  return (
    <div className="flex self-start rounded-[7px] border border-border-default bg-raised p-0.75">
      {AI_LOCALE_OPTIONS.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={classNames(
              "cursor-pointer rounded-[5px] px-3.5 py-1.25 text-xs font-semibold transition-colors",
              isActive
                ? "bg-primary-500/20 text-primary-100"
                : "text-text-secondary hover:text-text-strong",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
});

LocaleToggle.displayName = "LocaleToggle";

export default LocaleToggle;
