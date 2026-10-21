import React from "react";

import DetailRow from "@/components/shared/detail-row";
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
        <div className="flex flex-col gap-3">
          <DetailRow label="Provider">
            <span className="text-neutral-300">
              {settings.provider
                ? AI_PROVIDER_LABEL[settings.provider]
                : "Belum diatur"}
            </span>
          </DetailRow>
          <DetailRow label="Model">
            <span className="font-mono text-xs wrap-anywhere text-neutral-300">
              {settings.model ?? "—"}
            </span>
          </DetailRow>
          <DetailRow label="Izin data">
            <span className="text-neutral-300">
              {settings.consent.granted ? "Diizinkan" : "Belum diizinkan"}
            </span>
          </DetailRow>
          <DetailRow label="Bahasa summary">
            <span className="text-neutral-300">
              {AI_LOCALE_READONLY_LABEL[settings.locale]}
            </span>
          </DetailRow>
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
