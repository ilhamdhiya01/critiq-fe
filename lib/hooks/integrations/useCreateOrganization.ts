import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useShallow } from "zustand/shallow";

import { userKeys } from "@/lib/hooks/auth/queryKeys";
import { toast } from "@/lib/toast";
import type { ErrorResponse } from "@/lib/types/api.types";
import { createOrganization } from "@/services/integrations.service";
import { useOnboardingStore } from "@/stores/onboarding/useOnboardingStore";

import { membershipWithOrgKeys } from "./queryKeys";

export const useCreateOrganization = () => {
  const queryClient = useQueryClient();
  const {
    organisation,
    setOrganisationName,
    setOrganisationSaved,
    hydrateOrganisationId,
  } = useOnboardingStore(
    useShallow((state) => ({
      organisation: state.organisation,
      setOrganisationName: state.setOrganisationName,
      setOrganisationSaved: state.setOrganisationSaved,
      hydrateOrganisationId: state.hydrateOrganisationId,
    })),
  );

  const mutation = useMutation({
    mutationFn: () =>
      createOrganization({
        name: organisation.name,
        organizationId: organisation.id ?? undefined,
      }),
    // POST when the wizard has no org yet, PATCH (rename) once it has one, so
    // Back → Continue never creates a second org.
    onSuccess: (res) => {
      const { id, name, slug } = res.data;
      setOrganisationSaved({ id, name, slug });
      // A new org re-issues the session cookie with it active.
      queryClient.invalidateQueries({ queryKey: membershipWithOrgKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success(res.message || "Organization successfull created");
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(error.response?.data?.message || error.message);
    },
  });

  const isNameUnsaved =
    organisation.name.trim() !== organisation.lastSavedName.trim();
  const needsSave = !organisation.id || isNameUnsaved;

  return {
    handleCreateOrganization: mutation.mutateAsync,
    isCreating: mutation.isPending,
    organisationName: organisation.name,
    organisationId: organisation.id,
    organisationSlug: organisation.slug,
    needsSave,
    setOrganisationName,
    hydrateOrganisationId,
  };
};
