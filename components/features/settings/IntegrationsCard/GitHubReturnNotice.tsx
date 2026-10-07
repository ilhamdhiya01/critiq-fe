"use client";

import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef } from "react";

import {
  GITHUB_RETURN_TOAST,
  type GitHubReturnStatus,
} from "@/const/integration.constant";
import { integrationKeys } from "@/lib/hooks/integrations/queryKeys";
import { toast } from "@/lib/toast";

interface GitHubReturnNoticeProps {
  orgId?: string;
}

// Handles `?github=connected|pending_approval|error` after the GitHub App
// install redirect: toast once, refetch, then drop the param so a refresh
// does not repeat the toast.
const GitHubReturnNotice = React.memo(({ orgId }: GitHubReturnNoticeProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const handledRef = useRef(false);

  const status = searchParams.get("github");

  useEffect(() => {
    if (!status) {
      handledRef.current = false;
      return;
    }
    if (handledRef.current) return;
    handledRef.current = true;

    const notice = GITHUB_RETURN_TOAST[status as GitHubReturnStatus];
    if (notice) toast[notice.variant](notice.message);

    if (orgId) {
      queryClient.invalidateQueries({ queryKey: integrationKeys.list(orgId) });
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("github");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [status, orgId, pathname, router, searchParams, queryClient]);

  return null;
});

GitHubReturnNotice.displayName = "GitHubReturnNotice";

export default GitHubReturnNotice;
