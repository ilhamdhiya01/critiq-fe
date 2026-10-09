import React from "react";

import Icon from "@/components/ui/icon/Icon";
import { GITHUB_ACCESS_REMOVED_MESSAGE } from "@/const/integration.constant";

// Shown wherever a GitHub call fails with 409 github_uninstalled/suspended.
const GitHubAccessNotice = React.memo(() => (
  <div
    role="alert"
    className="flex items-start gap-2.5 rounded-lg border border-warning/35 bg-warning/7 px-3.5 py-2.75"
  >
    <Icon
      icon="TbAlertTriangle"
      size={14}
      className="mt-px flex-none text-warning-light"
    />
    <span className="text-xs leading-normal text-warning-soft">
      {GITHUB_ACCESS_REMOVED_MESSAGE}
    </span>
  </div>
));

GitHubAccessNotice.displayName = "GitHubAccessNotice";

export default GitHubAccessNotice;
