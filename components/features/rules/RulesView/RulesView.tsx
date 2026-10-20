"use client";

import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import React, { useEffect } from "react";

import StateStatus from "@/components/shared/state-status";
import Notice from "@/components/ui/notice";
import Skeleton from "@/components/ui/skeleton";
import {
  getRuleTierElementId,
  isKnownRuleTier,
  RULE_TIER_HIGHLIGHT_MS,
  RULE_TIER_IDS,
} from "@/const/rules.constant";
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

  // Opened from global search (?tier=…): scroll to that tier and highlight it
  // briefly, then drop the param so the same search can highlight it again.
  const router = useRouter();
  const pathname = usePathname();
  const tierParam = useSearchParams().get("tier");
  const highlightedTier =
    tierParam && isKnownRuleTier(tierParam) ? tierParam : null;

  useEffect(() => {
    if (!rules || !highlightedTier) return;
    document
      .getElementById(getRuleTierElementId(highlightedTier))
      ?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    const timer = window.setTimeout(
      () => router.replace(pathname, { scroll: false }),
      RULE_TIER_HIGHLIGHT_MS,
    );
    return () => window.clearTimeout(timer);
  }, [rules, highlightedTier, router, pathname]);

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
          {Array.from({ length: RULE_TIER_IDS.length }, (_, index) => (
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
            isHighlighted={highlightedTier === tier.id}
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
              {rules.tiers.filter((tier) => tier.enabled).length} dari{" "}
              {rules.tiers.length} kategori aktif
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
