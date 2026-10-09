import React from "react";

import Icon from "@/components/ui/icon/Icon";

interface ManualModeNoticeProps {
  message: string;
}

const ManualModeNotice = React.memo(({ message }: ManualModeNoticeProps) => (
  <div className="flex items-center gap-2.5 rounded-lg border border-border-subtle bg-surface px-5 py-3.25">
    <Icon
      icon="TbAlertCircle"
      size={15}
      className="shrink-0 text-text-secondary"
    />
    <span className="text-[12.5px] text-text-nav">{message}</span>
  </div>
));

ManualModeNotice.displayName = "ManualModeNotice";

export default ManualModeNotice;
