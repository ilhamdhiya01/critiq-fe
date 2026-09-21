import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toast } from "@/lib/toast";
import { connectRepository } from "@/services/repositories.service";

import { repositoryKeys } from "./queryKeys";

export const useConnectRepository = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: connectRepository,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repositoryKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    handleConnectRepository: mutation.mutateAsync,
    isConnecting: mutation.isPending,
    connectError: mutation.error,
  };
};
