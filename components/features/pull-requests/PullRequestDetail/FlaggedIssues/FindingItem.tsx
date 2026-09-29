"use client";

import classNames from "classnames";
import React, { useCallback, useEffect, useRef } from "react";

import Icon from "@/components/ui/icon/Icon";
import {
  FINDING_SEVERITY_STYLE,
  FINDING_SOURCE_LABEL,
  FINDING_SOURCE_STYLE,
  getFindingIcon,
} from "@/const/pull-request.constant";
import { getDiffLineElementId } from "@/lib/helpers/diff.helper";
import type { Finding } from "@/lib/types/pull-request.types";
import { useDiffJumpStore } from "@/stores/useDiffJumpStore";

// How long the jumped-to line stays ringed.
const HIGHLIGHT_DURATION_MS = 2000;

interface FindingItemProps {
  finding: Finding;
  canJump: boolean;
}

const FindingItem = React.memo(({ finding, canJump }: FindingItemProps) => {
  const severityStyle = FINDING_SEVERITY_STYLE[finding.severity];
  const sourceStyle = FINDING_SOURCE_STYLE[finding.source];
  const setTarget = useDiffJumpStore((state) => state.setTarget);
  const clearTarget = useDiffJumpStore((state) => state.clearTarget);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleJump = useCallback(() => {
    const element = document.getElementById(
      getDiffLineElementId(finding.filePath, finding.lineStart),
    );
    if (!element) return;

    element.scrollIntoView({ behavior: "smooth", block: "center" });
    setTarget({ filePath: finding.filePath, line: finding.lineStart });

    // Restart the fade on every jump, so clicking a second finding does not
    // inherit the first one's countdown.
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(clearTarget, HIGHLIGHT_DURATION_MS);
  }, [finding.filePath, finding.lineStart, setTarget, clearTarget]);

  return (
    <div className="flex items-start gap-3.5 border-b border-border-row px-5 py-3.5 last:border-b-0">
      <span
        className={classNames(
          "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] font-semibold tracking-[0.03em] whitespace-nowrap",
          severityStyle.text,
          severityStyle.bg,
          severityStyle.border,
        )}
      >
        {finding.severity}
      </span>

      <span
        title={finding.source === "AI" ? "Model review" : "Static rule"}
        className={classNames(
          "inline-flex shrink-0 items-center rounded-full border px-1.5 py-0.5 font-mono text-[9.5px] font-semibold whitespace-nowrap",
          sourceStyle.text,
          sourceStyle.bg,
          sourceStyle.border,
        )}
      >
        {FINDING_SOURCE_LABEL[finding.source]}
      </span>

      {/* <Icon
        icon={getFindingIcon(finding.ruleId)}
        size={16}
        className={classNames(
          "mt-px shrink-0 stroke-[1.6]",
          severityStyle.text,
        )}
      /> */}

      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-xs font-semibold text-neutral-300">
          {finding.title} <span className="text-text-faint">·</span>{" "}
          {canJump ? (
            <button
              type="button"
              onClick={handleJump}
              title="Lihat baris ini di diff"
              className="cursor-pointer font-mono font-normal text-info-light underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400"
            >
              {finding.filePath}:{finding.lineStart}
            </button>
          ) : (
            <span
              title="Baris ini tidak ada di diff yang ditampilkan"
              className="font-mono font-normal text-text-faint"
            >
              {finding.filePath}:{finding.lineStart}
            </span>
          )}
        </span>
        <span className="text-[12.5px] leading-relaxed text-text-nav">
          {finding.message}
        </span>
      </div>
    </div>
  );
});

FindingItem.displayName = "FindingItem";

export default FindingItem;
