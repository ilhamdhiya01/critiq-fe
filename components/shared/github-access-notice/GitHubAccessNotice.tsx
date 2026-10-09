import React from "react";

import Notice from "@/components/ui/notice";
import { GITHUB_ACCESS_REMOVED_MESSAGE } from "@/const/integration.constant";

// Shown wherever a GitHub call fails with 409 github_uninstalled/suspended.
const GitHubAccessNotice = React.memo(() => (
  <Notice>{GITHUB_ACCESS_REMOVED_MESSAGE}</Notice>
));

GitHubAccessNotice.displayName = "GitHubAccessNotice";

export default GitHubAccessNotice;
