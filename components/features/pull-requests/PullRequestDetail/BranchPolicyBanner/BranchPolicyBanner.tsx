import React from "react";

import Notice from "@/components/ui/notice";

interface BranchPolicyBannerProps {
  targetBranch: string;
}

const BranchPolicyBanner = React.memo(
  ({ targetBranch }: BranchPolicyBannerProps) => (
    <Notice icon="TbLock" role="note">
      Branch policy for → {targetBranch}: Require Both — the AI analysis below
      and your manual review confirmation must both complete before Approve is
      enabled.
    </Notice>
  ),
);

BranchPolicyBanner.displayName = "BranchPolicyBanner";

export default BranchPolicyBanner;
