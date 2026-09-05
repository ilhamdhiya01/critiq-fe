import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";

import type { ApiResponse, ErrorResponse } from "@/lib/types/api.types";
import type { Repository } from "@/lib/types/repository.types";
import { disconnectRepository } from "@/services/repositories.service";

import { repositoryKeys } from "./queryKeys";

export const useDisconnectRepository = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: disconnectRepository,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: repositoryKeys.lists() });

      const previousList = queryClient.getQueryData<ApiResponse<Repository[]>>(
        repositoryKeys.lists(),
      );

      queryClient.setQueryData<ApiResponse<Repository[]>>(
        repositoryKeys.lists(),
        (current) =>
          current && {
            ...current,
            data: current.data.filter((repo) => repo.id !== id),
          },
      );

      return { previousList };
    },
    onError: (
      error: AxiosError<ErrorResponse>,
      _id,
      context?: { previousList?: ApiResponse<Repository[]> },
    ) => {
      if (context?.previousList) {
        queryClient.setQueryData(repositoryKeys.lists(), context.previousList);
      }
      toast.error(error.response?.data?.message || error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: repositoryKeys.lists() });
    },
  });

  return {
    handleDisconnectRepository: mutation.mutateAsync,
    isDisconnecting: mutation.isPending,
    disconnectError: mutation.error,
  };
};
