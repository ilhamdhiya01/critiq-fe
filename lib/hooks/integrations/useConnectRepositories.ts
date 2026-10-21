import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useRouter } from "next/navigation";

import { GITHUB_ACCESS_REMOVED_MESSAGE } from "@/const/integration.constant";
import { CONNECT_REPOS_FORBIDDEN_MESSAGE } from "@/const/repository.constant";
import {
  getErrorCode,
  isGitHubAccessError,
} from "@/lib/helpers/integration.helper";
import { userKeys } from "@/lib/hooks/auth/queryKeys";
import { repositoryKeys } from "@/lib/hooks/repositories/queryKeys";
import { toast } from "@/lib/toast";
import type { ErrorResponse } from "@/lib/types/api.types";
import type { ConnectRepositoryInput } from "@/lib/types/repository.types";
import { ROUTES } from "@/routes";
import { connectRepositories } from "@/services/integrations.service";

import { integrationKeys, membershipWithOrgKeys } from "./queryKeys";

interface UseConnectRepositoriesOptions {
  // Onboarding: summarise with a toast and go to the dashboard. Without it the
  // caller (Settings modal) renders the per-repo result itself.
  redirectSlug?: string;
}

export const useConnectRepositories = (
  orgId: string,
  options?: UseConnectRepositoriesOptions,
) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const redirectSlug = options?.redirectSlug;

  const mutation = useMutation({
    mutationFn: (payload: ConnectRepositoryInput) =>
      connectRepositories(orgId, payload),
    onSuccess: async (response, payload) => {
      const items = response.data.items;
      const failed = items.filter((item) => item.status === "failed");
      const succeeded = items.filter((item) => item.status === "ok");

      if (succeeded.length > 0) {
        // The first repo completes the org's setup (onboardingCompleted), so
        // the setup banner and the switcher's "Finish setup" go away.
        queryClient.invalidateQueries({ queryKey: membershipWithOrgKeys.all });
        queryClient.invalidateQueries({ queryKey: repositoryKeys.org(orgId) });
        queryClient.invalidateQueries({ queryKey: repositoryKeys.lists() });
        queryClient.invalidateQueries({
          queryKey: integrationKeys.candidates(orgId, payload.source),
        });
      }

      if (redirectSlug === undefined) return;

      if (succeeded.length === 0) {
        // semua gagal — jangan pindah ke dashboard, biarkan user perbaiki di step ini
        toast.error("Failed to connect repositories. Please try again.");
        return;
      }

      if (failed.length > 0) {
        // partial success — kasih tahu apa yang gagal, tapi tetap lanjut
        toast.warning(
          `${succeeded.length} of ${items.length} repositories connected`,
          {
            description: `${failed.length} failed — you can retry from Repositories.`,
          },
        );
      } else {
        toast.success("All repositories connected");
      }

      // Onboarding is now done for this org (the BE re-issued the session).
      // Refetch before leaving: the org layout reads onboardingCompleted from
      // memberships and would bounce a stale "unfinished" org back to setup.
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      await queryClient.refetchQueries({ queryKey: membershipWithOrgKeys.all });
      router.replace(ROUTES.dashboard(redirectSlug));
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      if (isGitHubAccessError(getErrorCode(error))) {
        queryClient.invalidateQueries({
          queryKey: integrationKeys.list(orgId),
        });
        toast.error(GITHUB_ACCESS_REMOVED_MESSAGE);
        return;
      }
      toast.error(
        error.response?.status === 403
          ? CONNECT_REPOS_FORBIDDEN_MESSAGE
          : error.message,
      );
    },
  });

  return {
    handleConnectRepositories: mutation.mutateAsync,
    isConnectingRepos: mutation.isPending,
  };
};
