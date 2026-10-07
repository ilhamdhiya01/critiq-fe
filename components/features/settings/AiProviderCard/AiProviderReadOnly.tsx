import React from "react";

import {
  AI_LOCALE_READONLY_LABEL,
  AI_PROVIDER_LABEL,
} from "@/const/ai-settings.constant";
import type { AiSettings } from "@/lib/types/ai-settings.types";

interface AiProviderReadOnlyProps {
  settings: AiSettings;
}

const AiProviderReadOnly = React.memo(
  ({ settings }: AiProviderReadOnlyProps) => {
    return (
      <>
        <div className="grid grid-cols-[140px_1fr] items-center gap-3 text-[12.5px]">
          <span className="text-text-secondary">Provider</span>
          <span className="text-neutral-300">
            {settings.provider
              ? AI_PROVIDER_LABEL[settings.provider]
              : "Belum diatur"}
          </span>

          <span className="text-text-secondary">Model</span>
          <span className="font-mono text-xs text-neutral-300">
            {settings.model ?? "—"}
          </span>

          <span className="text-text-secondary">Izin data</span>
          <span className="text-neutral-300">
            {settings.consent.granted ? "Diizinkan" : "Belum diizinkan"}
          </span>

          <span className="text-text-secondary">Bahasa summary</span>
          <span className="text-neutral-300">
            {AI_LOCALE_READONLY_LABEL[settings.locale]}
          </span>
        </div>
        <p className="text-[11.5px] text-text-muted">
          Hanya Admin yang bisa mengubah pengaturan AI.
        </p>
      </>
    );
  },
);

AiProviderReadOnly.displayName = "AiProviderReadOnly";

export default AiProviderReadOnly;
