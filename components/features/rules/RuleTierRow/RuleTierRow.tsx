import classNames from "classnames";
import React from "react";

import Badge from "@/components/ui/badge";
import Icon from "@/components/ui/icon/Icon";
import Switch from "@/components/ui/switch";
import {
  getRuleTierElementId,
  RULE_ENGINE_LABEL,
  RULE_TIER_META,
} from "@/const/rules.constant";
import type { RuleTier } from "@/lib/types/rules.types";

interface RuleTierRowProps {
  tier: RuleTier;
  // Only an Admin may change the profile; everyone else sees the state.
  canEdit: boolean;
  pending: boolean;
  onToggle: (tier: RuleTier, enabled: boolean) => void;
  // Briefly true when opened from global search.
  isHighlighted?: boolean;
}

const RuleTierRow = React.memo(
  ({
    tier,
    canEdit,
    pending,
    onToggle,
    isHighlighted = false,
  }: RuleTierRowProps) => {
    const meta = RULE_TIER_META[tier.id];

    const handleToggle = React.useCallback(
      (enabled: boolean) => onToggle(tier, enabled),
      [onToggle, tier],
    );

    return (
      <div
        id={getRuleTierElementId(tier.id)}
        data-highlighted={isHighlighted || undefined}
        className={classNames(
          "-mx-3 flex scroll-mt-20 items-start justify-between gap-4 rounded-md px-3 py-3.5 transition-colors duration-500 motion-reduce:transition-none",
          { "bg-primary-500/10 ring-1 ring-primary-500/40": isHighlighted },
        )}
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border-default bg-raised text-text-secondary">
            <Icon icon={meta.icon} size={15} />
          </span>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] font-semibold text-text-strong">
                {meta.title}
              </span>
              <Badge tone="neutral" size="xs" shape="tag">
                {RULE_ENGINE_LABEL[tier.engine]}
              </Badge>
              {tier.requiresAi && (
                <Badge tone="orange" size="xs" shape="tag">
                  Perlu AI
                </Badge>
              )}
            </div>
            <span className="text-[12px] leading-normal text-text-faint">
              {meta.description}
            </span>
            {tier.requiresAi && (
              <span className="text-[11px] leading-normal text-text-faint">
                Tidak dicek pada PR tanpa AI review (Manual only, provider belum
                diatur, atau diff terlalu besar).
              </span>
            )}
          </div>
        </div>

        <Switch
          checked={tier.enabled}
          onToggle={handleToggle}
          disabled={!canEdit || pending}
          aria-label={`${meta.title} ${tier.enabled ? "aktif" : "nonaktif"}`}
        />
      </div>
    );
  },
);

RuleTierRow.displayName = "RuleTierRow";

export default RuleTierRow;
