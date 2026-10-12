"use client";

import React from "react";

import StateStatus from "@/components/shared/state-status";
import { usePullRequestComments } from "@/lib/hooks/pull-requests/usePullRequestComments";
import type {
  CommentScope,
  CommentThread,
  Finding,
  ParsedPullRequestFile,
} from "@/lib/types/pull-request.types";

import DiffFile from "./DiffFile";

interface PullRequestDiffProps {
  files: ParsedPullRequestFile[];
  truncated: boolean;
  findings?: Finding[];
  scope: CommentScope;
}

const EMPTY_FINDINGS: Finding[] = [];
const NO_THREADS: Record<string, CommentThread[]> = {};

const PullRequestDiff = React.memo(
  ({
    files,
    truncated,
    findings = EMPTY_FINDINGS,
    scope,
  }: PullRequestDiffProps) => {
    // One query for every file; each row looks up its own line.
    const { data: comments } = usePullRequestComments(
      scope.orgId,
      scope.repoId,
      scope.pullId,
    );

    if (files.length === 0) {
      return <StateStatus title="Tidak ada perubahan file" />;
    }

    return (
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
        {files.map((file, index) => (
          <DiffFile
            key={file.path}
            file={file}
            isFirst={index === 0}
            findings={findings}
            threadsByKey={comments?.inlineByKey ?? NO_THREADS}
            scope={scope}
          />
        ))}
        {truncated && (
          <div className="border-t border-border-subtle px-5 py-3 font-mono text-[11px] text-text-faint">
            Sebagian file tidak ditampilkan karena diff terlalu besar.
          </div>
        )}
      </div>
    );
  },
);

PullRequestDiff.displayName = "PullRequestDiff";

export default PullRequestDiff;
