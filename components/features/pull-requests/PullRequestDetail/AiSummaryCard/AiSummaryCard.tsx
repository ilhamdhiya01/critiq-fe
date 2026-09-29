import React from "react";

import Icon from "@/components/ui/icon/Icon";

interface AiSummaryCardProps {
  criticalCount: number;
  suggestionCount: number;
  filesChanged: number;
  additions: number;
  deletions: number;
}

const AiSummaryCard = React.memo(
  ({
    criticalCount,
    suggestionCount,
    filesChanged,
    additions,
    deletions,
  }: AiSummaryCardProps) => (
    <div className="flex flex-col gap-3 rounded-lg border border-primary-500/45 bg-surface-tinted px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex flex-wrap items-center gap-2.5">
          <Icon icon="TbSparkles" size={15} className="text-primary-300" />
          <span className="font-mono text-[13px] font-semibold text-primary-100">
            AI Summary
          </span>
          <span className="rounded-full border border-primary-500/45 px-2.5 py-0.5 font-mono text-[10.5px] text-primary-300">
            claude-sonnet-4-5
          </span>
          <span className="rounded-full border border-danger/45 bg-danger/10 px-2.5 py-0.5 font-mono text-[10.5px] font-semibold text-danger-light">
            RISK · HIGH
          </span>
        </span>

        <button
          type="button"
          disabled
          title="Segera hadir"
          className="flex cursor-not-allowed items-center gap-1.5 rounded-md border border-primary-500/45 px-3 py-1.5 font-mono text-[11.5px] text-primary-300 opacity-50"
        >
          <Icon icon="TbRefresh" size={12} />
          Regenerate
        </button>
      </div>

      <p className="text-[13px] leading-relaxed text-primary-100">
        Perubahan ini merotasi token sesi saat refresh alih-alih memakai ulang
        token lama, menyentuh beberapa file di alur autentikasi. Logika
        rotasinya sendiri sudah benar dan idempotent, tapi analisis statis dan
        model sepakat menemukan beberapa temuan kritis yang perlu ditangani
        sebelum merge. Tidak ada perubahan API yang bersifat breaking.
      </p>

      <div className="flex flex-wrap gap-2">
        <span className="rounded-full border border-danger/40 bg-danger/10 px-2.5 py-1 font-mono text-[11px] font-medium text-danger-light">
          {criticalCount} critical
        </span>
        <span className="rounded-full border border-warning/40 bg-warning/10 px-2.5 py-1 font-mono text-[11px] font-medium text-warning-light">
          {suggestionCount} suggestions
        </span>
        <span className="rounded-full border border-border-default bg-raised px-2.5 py-1 font-mono text-[11px] font-medium text-text-secondary">
          {filesChanged} files · +{additions} −{deletions}
        </span>
      </div>
    </div>
  ),
);

AiSummaryCard.displayName = "AiSummaryCard";

export default AiSummaryCard;
