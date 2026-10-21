import React from "react";

import Button from "@/components/ui/button";
import type { IconName } from "@/components/ui/icon/Icon";
import Notice from "@/components/ui/notice";
import {
  AI_SUMMARY_NO_SCAN_CODE,
  AI_SUMMARY_NO_SCAN_STATE,
} from "@/const/pull-request.constant";
import type { AiBlockedView } from "@/lib/helpers/pull-request.helper";

interface AiBlockedNoticeProps {
  view: AiBlockedView;
  settingsHref: string;
  onRun: () => void;
  isRunning: boolean;
  onScan: () => void;
  isScanning: boolean;
}

const getIcon = (view: AiBlockedView): IconName => {
  if (view.isStale) return "TbCircleCheck";
  if (view.code === AI_SUMMARY_NO_SCAN_CODE) return "TbInfoCircle";
  return "TbAlertCircle";
};

// Something to fix → warning; otherwise an informational note.
const NOTICE_TONE = {
  indigo: "note",
  warning: "warning",
  neutral: "note",
} as const;

const AiBlockedNotice = React.memo(
  ({
    view,
    settingsHref,
    onRun,
    isRunning,
    onScan,
    isScanning,
  }: AiBlockedNoticeProps) => {
    return (
      <Notice tone={NOTICE_TONE[view.tone]} icon={getIcon(view)} role="note">
        <span className="flex flex-wrap items-start gap-3">
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-[12.5px] font-semibold text-neutral-100">
              {view.title}
            </span>
            <span className="text-xs leading-normal text-text-nav">
              {view.body}
            </span>
            {view.note && (
              <span className="text-[11.5px] text-text-muted">{view.note}</span>
            )}
            {view.roleNote && (
              <span className="text-[11.5px] text-text-faint">
                {view.roleNote}
              </span>
            )}
          </span>
          {view.action === "run" && (
            <Button
              type="button"
              variant="ghost-primary"
              size="sm"
              fullWidth={false}
              onClick={onRun}
              disabled={isRunning}
              isLoading={isRunning}
              className="font-mono whitespace-nowrap"
            >
              Run AI review
            </Button>
          )}
          {view.action === "scan" && (
            <Button
              type="button"
              variant="ghost-primary"
              size="sm"
              fullWidth={false}
              onClick={onScan}
              disabled={isScanning}
              isLoading={isScanning}
              className="font-mono whitespace-nowrap"
            >
              {AI_SUMMARY_NO_SCAN_STATE.action}
            </Button>
          )}
          {view.action === "settings" && (
            <Button
              link={settingsHref}
              variant="ghost-primary"
              size="sm"
              fullWidth={false}
              className="font-mono whitespace-nowrap"
            >
              Open Settings
            </Button>
          )}
        </span>
      </Notice>
    );
  },
);

AiBlockedNotice.displayName = "AiBlockedNotice";

export default AiBlockedNotice;
