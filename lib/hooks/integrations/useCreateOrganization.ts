import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useShallow } from "zustand/shallow";

import { createOrganization } from "@/services/integrations.service";
import { useOnboardingStore } from "@/stores/onboarding/useOnboardingStore";

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
    onSuccess: (data) => {
      setOrganisationSaved({ id: data.id, name: organisation.name });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
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
    needsSave,
    setOrganisationName,
    hydrateOrganisationId,
  };
};
