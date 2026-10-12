import classNames from "classnames";
import React from "react";

import Button from "@/components/ui/button";
import Icon, { type IconName } from "@/components/ui/icon/Icon";
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

const ICON_TONE = {
  indigo: "text-primary-300",
  warning: "text-warning-light",
  neutral: "text-text-secondary",
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
      <div className="flex flex-wrap items-start gap-3 rounded-md border border-dashed border-primary-500/35 bg-primary-500/6 px-3.5 py-3">
        <Icon
          icon={getIcon(view)}
          size={16}
          className={classNames("mt-px flex-none", ICON_TONE[view.tone])}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
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
        </div>
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
      </div>
    );
  },
);

AiBlockedNotice.displayName = "AiBlockedNotice";

export default AiBlockedNotice;
