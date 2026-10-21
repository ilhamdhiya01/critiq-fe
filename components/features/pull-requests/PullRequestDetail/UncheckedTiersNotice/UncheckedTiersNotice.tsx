import Link from "next/link";
import React from "react";

import Notice from "@/components/ui/notice";
import { isKnownRuleTier, RULE_TIER_META } from "@/const/rules.constant";
import { getUncheckedTiersNotice } from "@/lib/helpers/pull-request.helper";
import type { AiSummaryStatus } from "@/lib/types/pull-request.types";

interface UncheckedTiersNoticeProps {
  // From the latest scan. Older BE versions may still list a removed tier.
  tiers: readonly string[] | undefined;
  aiStatus: AiSummaryStatus | null | undefined;
  rulesHref: string;
  settingsHref: string;
}

// Enabled tiers the scan never checked because they need an AI review and
// none ran. Informational only.
const UncheckedTiersNotice = React.memo(
  ({ tiers, aiStatus, rulesHref, settingsHref }: UncheckedTiersNoticeProps) => {
    const known = (tiers ?? []).filter(isKnownRuleTier);
    const notice = getUncheckedTiersNotice(aiStatus);
    if (known.length === 0 || !notice) return null;

    return (
      <Notice tone={notice.tone} icon="TbAlertTriangle">
        Kategori {known.map((tier) => RULE_TIER_META[tier].title).join(", ")}{" "}
        {notice.body}
        {notice.link && (
          <>
            {" "}
            <Link
              href={
                notice.link.target === "settings" ? settingsHref : rulesHref
              }
              className="underline underline-offset-2 hover:text-text-strong"
            >
              {notice.link.label}
            </Link>
          </>
        )}
      </Notice>
    );
  },
);

UncheckedTiersNotice.displayName = "UncheckedTiersNotice";

export default UncheckedTiersNotice;
