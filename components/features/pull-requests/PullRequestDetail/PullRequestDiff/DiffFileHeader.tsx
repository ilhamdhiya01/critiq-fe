import classNames from "classnames";
import React from "react";

import type { ParsedPullRequestFile } from "@/lib/types/pull-request.types";

interface DiffFileHeaderProps {
  file: ParsedPullRequestFile;
  isFirst: boolean;
  // "Click a line to comment" hint, shown on the first file only.
  showCommentHint: boolean;
}

// Path + counts bar, used both in the list and as the pinned overlay.
const DiffFileHeader = React.memo(
  ({ file, isFirst, showCommentHint }: DiffFileHeaderProps) => {
    const displayPath =
      file.status === "renamed" && file.previousPath
        ? `${file.previousPath} → ${file.path}`
        : file.path;

    return (
      <div
        className={classNames(
          "flex items-center justify-between gap-4 border-b border-border-subtle px-5 py-3",
          { "bg-surface": isFirst, "border-t bg-sunken": !isFirst },
        )}
      >
        <span
          title={displayPath}
          className="min-w-0 truncate font-mono text-[12.5px] font-semibold text-text-strong"
        >
          {displayPath}
        </span>
        <span className="shrink-0 font-mono text-[11px] text-text-faint">
          UNIFIED · +{file.addedCount} −{file.removedCount}
          {showCommentHint && " · KLIK BARIS UNTUK KOMENTAR"}
        </span>
      </div>
    );
  },
);

DiffFileHeader.displayName = "DiffFileHeader";

export default DiffFileHeader;
