import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { toast } from "@/lib/toast";
import { ConnectRepositoryInput } from "@/lib/types/repository.types";
import { ROUTES } from "@/routes";
import { connectRepositories } from "@/services/integrations.service";

export const useConnectRepositories = (orgId: string) => {
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: (payload: ConnectRepositoryInput) =>
      connectRepositories(orgId, payload),
    onSuccess: (response) => {
      const items = response.data.items;
      const failed = items.filter((item) => item.status === "failed");
      const succeeded = items.filter((item) => item.status === "ok");

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

      router.replace(ROUTES.ROOT);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    handleConnectRepositories: mutation.mutateAsync,
    isConnectingRepos: mutation.isPending,
  };
};
