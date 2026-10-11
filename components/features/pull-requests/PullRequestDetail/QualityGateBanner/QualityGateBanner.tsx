import classNames from "classnames";
import Link from "next/link";
import React from "react";

import Badge from "@/components/ui/badge";
import Icon, { type IconName } from "@/components/ui/icon/Icon";
import Notice from "@/components/ui/notice";
import {
  PR_GATE_CI_BADGE_STYLE,
  PR_GATE_CI_LABEL,
  PR_GATE_REASON_LABEL,
  PR_GATE_STATUS_BADGE_STYLE,
  PR_GATE_STATUS_LABEL,
} from "@/const/pull-request.constant";
import { RULE_TIER_META } from "@/const/rules.constant";
import type {
  PrQualityGate,
  QualityGateStatus,
} from "@/lib/types/pull-request.types";

interface QualityGateBannerProps {
  gate: PrQualityGate;
  rulesHref: string;
}

const BANNER_TONE: Record<
  QualityGateStatus,
  { icon: IconName; root: string; iconClass: string }
> = {
  passed: {
    icon: "TbCircleCheck",
    root: "border-success/35 bg-success/7",
    iconClass: "text-success",
  },
  failed: {
    icon: "TbAlertCircle",
    root: "border-danger/35 bg-danger/7",
    iconClass: "text-danger-light",
  },
  pending: {
    icon: "TbClock",
    root: "border-warning/35 bg-warning/7",
    iconClass: "text-warning-light",
  },
};

const QualityGateBanner = React.memo(
  ({ gate, rulesHref }: QualityGateBannerProps) => {
    const tone = BANNER_TONE[gate.status];

    return (
      <>
        <div
          role={gate.status === "failed" ? "alert" : "status"}
          className={classNames(
            "flex items-start gap-3 rounded-lg border px-4 py-3",
            tone.root,
          )}
        >
          <Icon
            icon={tone.icon}
            size={16}
            className={classNames("mt-0.5 shrink-0", tone.iconClass)}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12.5px] font-semibold text-text-strong">
                Quality gate
              </span>
              <Badge palette={PR_GATE_STATUS_BADGE_STYLE[gate.status]}>
                {PR_GATE_STATUS_LABEL[gate.status]}
              </Badge>
              <Badge
                palette={PR_GATE_CI_BADGE_STYLE[gate.ci]}
                shape="tag"
                size="xs"
              >
                {PR_GATE_CI_LABEL[gate.ci]}
              </Badge>
            </div>
            {gate.reasons.length > 0 && (
              <span className="text-[12px] leading-normal text-text-nav">
                {gate.reasons
                  .map((reason) => PR_GATE_REASON_LABEL[reason])
                  .join(" · ")}
              </span>
            )}
            <Link
              href={rulesHref}
              className="w-fit text-[11.5px] text-info-light hover:underline"
            >
              Lihat quality profile
            </Link>
          </div>
        </div>

        {gate.uncheckedTiers.length > 0 && (
          <Notice tone="warning" icon="TbAlertTriangle">
            Kategori{" "}
            {gate.uncheckedTiers
              .map((tier) => RULE_TIER_META[tier].title)
              .join(", ")}{" "}
            tidak dicek — AI review tidak berjalan di scan ini.{" "}
            <Link
              href={rulesHref}
              className="underline underline-offset-2 hover:text-warning-light"
            >
              Atur quality profile
            </Link>
          </Notice>
        )}
      </>
    );
  },
);

QualityGateBanner.displayName = "QualityGateBanner";

export default QualityGateBanner;
