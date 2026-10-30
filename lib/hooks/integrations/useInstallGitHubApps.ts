import { useMutation } from "@tanstack/react-query";

import { GITHUB_INSTALL_URL_INVALID_MESSAGE } from "@/const/integration.constant";
import { isGitHubUrl } from "@/lib/helpers/integration.helper";
import { toast } from "@/lib/toast";
import { installIntentGithub } from "@/services/integrations.service";

export const useInstallGitHubApps = (
  orgId: string,
  returnTo: "setup" | "settings" = "setup",
) => {
  const mutation = useMutation({
    mutationFn: () => installIntentGithub(orgId, { returnTo }),
    onSuccess: (response) => {
      const { installUrl } = response.data;
      if (!isGitHubUrl(installUrl)) {
        toast.error(GITHUB_INSTALL_URL_INVALID_MESSAGE);
        return;
      }
      window.location.assign(installUrl);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    handleInstallIntentGitHub: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
};
