import { useQuery } from "@tanstack/react-query";

import { parseUnifiedPatch } from "@/lib/helpers/diff.helper";
import type { ApiResponse } from "@/lib/types/api.types";
import type {
  ParsedPullRequestDiff,
  PullRequestDiff,
} from "@/lib/types/pull-request.types";
import { getPullRequestDetailDiff } from "@/services/pull-requests.service";

import { pullRequestKeys } from "./queryKeys";

// Module level on purpose: an inline `select` is a new function every render,
// which makes TanStack Query re-run it (re-parsing every patch) each time the
// detail page renders.
const selectDiff = (
  response: ApiResponse<PullRequestDiff>,
): ParsedPullRequestDiff => {
  const diff = response.data;
  return {
    truncated: diff.truncated,
    files: diff.files.map((file) => {
      const lines = file.patch ? parseUnifiedPatch(file.patch) : [];
      return {
        ...file,
        lines,
        addedCount:
          file.additions ??
          lines.filter((line) => line.type === "added").length,
        removedCount:
          file.deletions ??
          lines.filter((line) => line.type === "removed").length,
      };
    }),
  };
};

export const usePullRequestDetailDiff = (
  orgId: string,
  repoId: string,
  id: string,
) => {
  return useQuery({
    queryKey: pullRequestKeys.diff(orgId, repoId, id),
    queryFn: () => getPullRequestDetailDiff(orgId, repoId, id),
    select: selectDiff,
    enabled: !!orgId && !!repoId && !!id,
  });
};
