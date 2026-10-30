"use client";

import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef } from "react";

import {
  GITHUB_ERROR_REASON_MESSAGE,
  GITHUB_RETURN_TOAST,
  type GitHubReturnStatus,
} from "@/const/integration.constant";
import { integrationKeys } from "@/lib/hooks/integrations/queryKeys";
import { toast } from "@/lib/toast";

// Handles `?github=connected|pending_approval|error|updated` (plus `reason`
// on errors) after the GitHub App install or "Manage on GitHub" redirect, in
// Settings, onboarding and `/`: toast once, refetch every integration query
// (so newly granted repos show up as candidates), then drop the params so a
// refresh does not repeat the toast.
const GitHubReturnNotice = React.memo(() => {
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

    // Own keys only: the value comes straight from the URL.
    const reason = searchParams.get("reason") ?? "";
    const reasonMessage =
      status === "error" && Object.hasOwn(GITHUB_ERROR_REASON_MESSAGE, reason)
        ? GITHUB_ERROR_REASON_MESSAGE[reason]
        : null;
    if (reasonMessage) {
      toast.error(reasonMessage);
    } else if (Object.hasOwn(GITHUB_RETURN_TOAST, status)) {
      const notice = GITHUB_RETURN_TOAST[status as GitHubReturnStatus];
      toast[notice.variant](notice.message);
    }

    queryClient.invalidateQueries({ queryKey: integrationKeys.all });

    const params = new URLSearchParams(searchParams.toString());
    params.delete("github");
    params.delete("reason");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [status, pathname, router, searchParams, queryClient]);

  return null;
});

GitHubReturnNotice.displayName = "GitHubReturnNotice";

export default GitHubReturnNotice;
