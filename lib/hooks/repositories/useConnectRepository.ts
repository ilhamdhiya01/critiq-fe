import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";

import type { ErrorResponse } from "@/lib/types/api.types";
import { connectRepository } from "@/services/repositories.service";

import { repositoryKeys } from "./queryKeys";

export const useConnectRepository = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: connectRepository,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repositoryKeys.lists() });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(error.response?.data?.message || error.message);
    },
  });

  return {
    handleConnectRepository: mutation.mutateAsync,
    isConnecting: mutation.isPending,
    connectError: mutation.error,
  };
};
