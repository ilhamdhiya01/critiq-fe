import React from "react";

interface DetailRowProps {
  label: React.ReactNode;
  children: React.ReactNode;
}

// One label/value row of a read-only detail list: stacked on phones, a 140px
// label column from `sm`. Stack rows in a `flex flex-col gap-3` container.
const DetailRow = React.memo(({ label, children }: DetailRowProps) => (
  <div className="grid grid-cols-1 gap-1 text-[12.5px] sm:grid-cols-[140px_1fr] sm:items-center sm:gap-3">
    <div className="text-text-secondary">{label}</div>
    <div className="min-w-0">{children}</div>
  </div>
));

DetailRow.displayName = "DetailRow";

export default DetailRow;
