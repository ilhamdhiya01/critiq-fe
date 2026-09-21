import { useMutation } from "@tanstack/react-query";

import { toast } from "@/lib/toast";
import { installIntentGithub } from "@/services/integrations.service";

export const useInstallGitHubApps = (orgId: string) => {
  const mutation = useMutation({
    mutationFn: () => installIntentGithub(orgId, { returnTo: "setup" }),
    onSuccess: (response) => {
      window.location.assign(response.data.installUrl);
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
