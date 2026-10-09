import classNames from "classnames";
import React from "react";

import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon/Icon";
import type { AiBlockedView } from "@/lib/helpers/pull-request.helper";

interface AiBlockedNoticeProps {
  view: AiBlockedView;
  settingsHref: string;
  onRun: () => void;
  isRunning: boolean;
}

const ICON_TONE = {
  indigo: "text-primary-300",
  warning: "text-warning-light",
  neutral: "text-text-secondary",
} as const;

const AiBlockedNotice = React.memo(
  ({ view, settingsHref, onRun, isRunning }: AiBlockedNoticeProps) => {
    return (
      <div className="flex flex-wrap items-start gap-3 rounded-md border border-dashed border-primary-500/35 bg-primary-500/6 px-3.5 py-3">
        <Icon
          icon={view.isStale ? "TbCircleCheck" : "TbAlertCircle"}
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
