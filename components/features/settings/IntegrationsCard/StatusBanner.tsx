import classNames from "classnames";
import React from "react";

import Icon from "@/components/ui/icon/Icon";

interface StatusBannerProps {
  tone: "orange" | "red";
  message: string;
}

const StatusBanner = React.memo(({ tone, message }: StatusBannerProps) => {
  const isWarning = tone === "orange";

  return (
    <div
      className={classNames(
        "flex items-start gap-2.5 rounded-lg border px-3.5 py-2.75",
        isWarning
          ? "border-warning/35 bg-warning/7"
          : "border-danger/35 bg-danger/7",
      )}
    >
      <Icon
        icon="TbAlertTriangle"
        size={14}
        className={classNames(
          "mt-px flex-none",
          isWarning ? "text-warning-light" : "text-danger-light",
        )}
      />
      <span
        className={classNames(
          "text-xs leading-normal",
          isWarning ? "text-warning-soft" : "text-danger-light",
        )}
      >
        {message}
      </span>
    </div>
  );
});

StatusBanner.displayName = "StatusBanner";

export default StatusBanner;
