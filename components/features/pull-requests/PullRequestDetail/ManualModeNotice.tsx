import React from "react";

import Notice from "@/components/ui/notice";

interface ManualModeNoticeProps {
  message: string;
}

const ManualModeNotice = React.memo(({ message }: ManualModeNoticeProps) => (
  <Notice tone="note" icon="TbAlertCircle" role="note">
    {message}
  </Notice>
));

ManualModeNotice.displayName = "ManualModeNotice";

export default ManualModeNotice;
