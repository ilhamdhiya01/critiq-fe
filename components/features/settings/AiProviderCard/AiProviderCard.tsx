"use client";

import React from "react";

import Icon from "@/components/ui/icon/Icon";
import { isAdminSettings } from "@/lib/helpers/ai-settings.helper";
import { useAiSettings } from "@/lib/hooks/ai-settings/useAiSettings";

import AiProviderCardSkeleton from "./AiProviderCardSkeleton";
import AiProviderForm from "./AiProviderForm";
import AiProviderReadOnly from "./AiProviderReadOnly";

interface AiProviderCardProps {
  orgId?: string;
}

const AiProviderCard = React.memo(({ orgId }: AiProviderCardProps) => {
  const { data: settings, isLoading, isError } = useAiSettings(orgId);

  const renderBody = () => {
    if (isError || !orgId) {
      return (
        <p className="text-[12.5px] text-danger-light">
          Gagal memuat pengaturan AI. Coba muat ulang halaman.
        </p>
      );
    }
    if (isLoading || !settings) return <AiProviderCardSkeleton />;

    // The BE only sends `providers` (and credentials) to Admins, so the
    // response shape decides between the form and the read-only summary.
    return isAdminSettings(settings) ? (
      <AiProviderForm orgId={orgId} settings={settings} />
    ) : (
      <AiProviderReadOnly settings={settings} />
    );
  };

  const isAiBlocked =
    !!settings && (!settings.provider || !settings.consent.granted);

  return (
    <div className="flex flex-col gap-3.5 rounded-lg border border-border-subtle bg-surface px-5 py-4.5">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[13px] font-semibold text-text-strong">
          AI Provider
        </span>
        <span className="text-[11.5px] leading-normal text-text-faint">
          Provider, model, dan API key untuk AI review organisasi ini. Critiq
          tidak punya key bawaan.
        </span>
      </div>

      {isAiBlocked && (
        <div className="flex items-start gap-2.5 rounded-lg border border-warning/35 bg-warning/7 px-3.5 py-2.5">
          <Icon
            icon="TbAlertTriangle"
            size={14}
            className="mt-px flex-none text-warning-light"
          />
          <span className="text-xs leading-normal text-warning-soft">
            Review AI tidak berjalan sampai provider dan izin diatur.
          </span>
        </div>
      )}

      {renderBody()}
    </div>
  );
});

AiProviderCard.displayName = "AiProviderCard";

export default AiProviderCard;
