import React from "react";

import Icon from "@/components/ui/icon/Icon";

interface BranchPolicyBannerProps {
  targetBranch: string;
}

const BranchPolicyBanner = React.memo(
  ({ targetBranch }: BranchPolicyBannerProps) => (
    <div className="flex items-center gap-2.5 rounded-lg border border-warning/45 bg-warning/7 px-4 py-3">
      <Icon icon="TbLock" size={15} className="shrink-0 text-warning-light" />
      <span className="text-[12.5px] text-warning-light">
        Branch policy untuk → {targetBranch}: Wajib Keduanya — analisis AI di
        bawah dan konfirmasi review manual kamu harus selesai dulu sebelum
        Approve aktif.
      </span>
    </div>
  ),
);

BranchPolicyBanner.displayName = "BranchPolicyBanner";

export default BranchPolicyBanner;
