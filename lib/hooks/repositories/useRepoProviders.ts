import { useMemo } from "react";

import type { IntegrationProvider } from "@/lib/types/integration.types";

import { useOrgRepositories } from "./useOrgRepositories";

// repoId → provider, from the cached repo list (for "#12" vs "!12" labels).
export const useRepoProviders = (
  orgId: string | undefined,
): Map<string, IntegrationProvider> => {
  const { data: repos } = useOrgRepositories(orgId);

  return useMemo(
    () => new Map((repos ?? []).map((repo) => [repo.id, repo.provider])),
    [repos],
  );
};
