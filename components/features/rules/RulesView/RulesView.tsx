"use client";

import { useParams } from "next/navigation";
import React from "react";

import StateStatus from "@/components/shared/state-status";
import Notice from "@/components/ui/notice";
import Skeleton from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/helpers/date.helper";
import { useOrgBySlug } from "@/lib/hooks/organisation/useOrgBySlug";
import { useOrgRules } from "@/lib/hooks/rules/useOrgRules";
import { useUpdateOrgRules } from "@/lib/hooks/rules/useUpdateOrgRules";
import type { RuleTier } from "@/lib/types/rules.types";

import RuleTierRow from "../RuleTierRow";

interface RulesViewProps {
  orgId?: string;
}

const RulesView = React.memo(({ orgId }: RulesViewProps) => {
  const params = useParams<{ slug: string }>();
  const { membership } = useOrgBySlug(params.slug);
  const isAdmin = membership?.role === "ADMIN";

  const { data: rules, isLoading, isError } = useOrgRules(orgId);
  const { updateTier, pendingTier } = useUpdateOrgRules(orgId);

  const handleToggle = React.useCallback(
    (tier: RuleTier, enabled: boolean) =>
      updateTier({ tier: tier.id, enabled }),
    [updateTier],
  );

  const renderBody = () => {
    if (isError || !orgId) {
      return (
        <StateStatus
          title="Gagal memuat quality profile"
          description="Coba muat ulang halaman. Kalau masih gagal, cek koneksi ke server."
        />
      );
    }
    if (isLoading || !rules) {
      return (
        <div className="flex flex-col gap-4 py-2">
          {Array.from({ length: 7 }, (_, index) => (
            <Skeleton key={index} className="h-12 rounded-md" />
          ))}
        </div>
      );
    }

    return (
      <div className="flex flex-col divide-y divide-border-row">
        {rules.tiers.map((tier) => (
          <RuleTierRow
            key={tier.id}
            tier={tier}
            canEdit={isAdmin}
            pending={pendingTier === tier.id}
            onToggle={handleToggle}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="mx-auto flex flex-col gap-4">
      <div className="flex flex-col gap-3.5 rounded-lg border border-border-subtle bg-surface px-5 py-4.5">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[13px] font-semibold text-text-strong">
            Quality Profile
          </span>
          <span className="text-[11.5px] leading-normal text-text-faint">
            Kategori Critical yang dicek Critiq di setiap scan PR. Menonaktifkan
            satu kategori menghentikan semua pemeriksaannya — static maupun AI —
            dan scan berikutnya berjalan penuh dengan profil baru.
          </span>
        </div>

        {!isAdmin && (
          <Notice tone="info" icon="TbInfoCircle">
            Hanya Admin yang bisa mengubah quality profile.
          </Notice>
        )}

        {renderBody()}

        {rules && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-row pt-3">
            <span className="text-[11.5px] text-text-faint">
              {rules.enabledCount} dari {rules.totalCount} kategori aktif
            </span>
            {rules.updatedAt && (
              <span className="text-[11.5px] text-text-faint">
                Terakhir diubah {formatDateTime(rules.updatedAt)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

RulesView.displayName = "RulesView";

export default RulesView;
