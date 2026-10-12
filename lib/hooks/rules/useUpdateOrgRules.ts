import { useMutation, useQueryClient } from "@tanstack/react-query";

import { RULE_TIER_META } from "@/const/rules.constant";
import { toast } from "@/lib/toast";
import type { ApiResponse } from "@/lib/types/api.types";
import type { OrgRules, UpdateRuleTierInput } from "@/lib/types/rules.types";
import { updateRuleTier } from "@/services/rules.service";

import { rulesKeys } from "./queryKeys";

export const useUpdateOrgRules = (orgId: string | undefined) => {
  const queryClient = useQueryClient();
  const key = rulesKeys.org(orgId ?? "");

  const mutation = useMutation({
    mutationFn: (input: UpdateRuleTierInput) =>
      updateRuleTier(orgId as string, input),
    // Flip the switch right away; the PATCH confirms or we roll back.
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ApiResponse<OrgRules>>(key);
      queryClient.setQueryData<ApiResponse<OrgRules>>(key, (current) =>
        current
          ? {
              ...current,
              data: {
                ...current.data,
                tiers: current.data.tiers.map((tier) =>
                  tier.id === input.tier
                    ? { ...tier, enabled: input.enabled }
                    : tier,
                ),
              },
            }
          : current,
      );
      return { previous };
    },
    onSuccess: (response, input) => {
      queryClient.setQueryData(key, response);
      toast.success(
        `${RULE_TIER_META[input.tier].title} ${input.enabled ? "diaktifkan" : "dinonaktifkan"}. Scan berikutnya memakai profil baru.`,
      );
    },
    onError: (error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan");
    },
  });

  return {
    updateTier: mutation.mutate,
    // The tier row currently waiting on the server — only that switch locks.
    pendingTier: mutation.isPending ? mutation.variables?.tier : undefined,
  };
};
