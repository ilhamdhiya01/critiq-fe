import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import type { ErrorResponse } from "@/lib/types/api.types";
import type {
  IntegrationSource,
  RawRepoCandidate,
  RepoCandidate,
} from "@/lib/types/integration.types";
import { getIntegrationCandidates } from "@/services/integrations.service";

import { integrationKeys } from "./queryKeys";

const normalizeVisibility = (
  repo: RawRepoCandidate,
): RepoCandidate["visibility"] =>
  "private" in repo
    ? repo.private
      ? "private"
      : "public"
    : repo.visibility === "private"
      ? "private"
      : "public";

export const useIntegrationCandidates = (
  orgId: string,
  source: IntegrationSource,
  enabled: boolean,
) => {
  const query = useQuery({
    queryKey: integrationKeys.candidates(orgId, source),
    queryFn: () => getIntegrationCandidates(orgId, source),
    select: (response) =>
      (response.data ?? []).map((repo): RepoCandidate => ({
        id: repo.id,
        path: repo.path,
        lang: repo.lang,
        visibility: normalizeVisibility(repo),
        accessLevel: "accessLevel" in repo ? repo.accessLevel : undefined,
      })),
    enabled,
    retry: false,
  });

  const fieldErrors =
    (query.error as AxiosError<ErrorResponse> | null)?.response?.data?.errors ??
    [];
  const isNotConnected = fieldErrors.some(
    (error) =>
      error.message === "gitlab_not_connected" ||
      error.message === "github_not_connected",
  );

  return { ...query, isNotConnected };
};
