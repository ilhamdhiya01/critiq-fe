import { useQuery } from "@tanstack/react-query";

import {
  COMMENTS_POLL_IDLE_MS,
  COMMENTS_POLL_PENDING_MS,
} from "@/const/pull-request.constant";
import { getInlineThreadKey } from "@/lib/helpers/pull-request.helper";
import type { ApiResponse } from "@/lib/types/api.types";
import type { CommentThread } from "@/lib/types/pull-request.types";
import { getPullRequestComments } from "@/services/pull-requests.service";

import { pullRequestKeys } from "./queryKeys";

export interface GroupedCommentThreads {
  general: CommentThread[];
  // Current inline threads by diff line (see getInlineThreadKey).
  inlineByKey: Record<string, CommentThread[]>;
  // Inline threads on an older head — their line may have moved.
  outdated: CommentThread[];
}

// Module level so every observer shares one stable select.
const groupThreads = (
  response: ApiResponse<{ threads: CommentThread[] }>,
): GroupedCommentThreads => {
  const grouped: GroupedCommentThreads = {
    general: [],
    inlineByKey: {},
    outdated: [],
  };
  for (const thread of response.data?.threads ?? []) {
    if (thread.kind === "general") {
      grouped.general.push(thread);
    } else if (thread.outdated) {
      grouped.outdated.push(thread);
    } else if (thread.path && thread.side && thread.line !== null) {
      const key = getInlineThreadKey(thread.path, thread.side, thread.line);
      (grouped.inlineByKey[key] ??= []).push(thread);
    }
  }
  return grouped;
};

const hasPendingSync = (threads: CommentThread[] | undefined) =>
  !!threads?.some((thread) =>
    thread.comments.some((comment) => comment.sync?.status === "pending"),
  );

export const usePullRequestComments = (
  orgId: string,
  repoId: string,
  id: string,
) => {
  return useQuery({
    queryKey: pullRequestKeys.comments(orgId, repoId, id),
    queryFn: () => getPullRequestComments(orgId, repoId, id),
    select: groupThreads,
    enabled: !!orgId && !!repoId && !!id,
    refetchInterval: (query) =>
      hasPendingSync(query.state.data?.data?.threads)
        ? COMMENTS_POLL_PENDING_MS
        : COMMENTS_POLL_IDLE_MS,
  });
};
