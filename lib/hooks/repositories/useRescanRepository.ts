import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import type { ApiResponse } from "@/lib/types/api.types";
import type { Repository } from "@/lib/types/repository.types";
import { rescanRepository } from "@/services/repositories.service";

import { repositoryKeys } from "./queryKeys";

export const useRescanRepository = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: rescanRepository,
    onMutate: (id: string) => {
      queryClient.setQueryData<ApiResponse<Repository>>(
        repositoryKeys.detail(id),
        (current) =>
          current && {
            ...current,
            data: { ...current.data, scanStatus: "scanning" },
          },
      );
    },
    onSuccess: (_response, id) => {
      queryClient.invalidateQueries({ queryKey: repositoryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: repositoryKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    handleRescanRepository: mutation.mutateAsync,
    isRescanning: mutation.isPending,
    rescanError: mutation.error,
  };
};
