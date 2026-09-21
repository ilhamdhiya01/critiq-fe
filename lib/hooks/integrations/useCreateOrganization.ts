import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useShallow } from "zustand/shallow";

import { toast } from "@/lib/toast";
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
    onSuccess: (res) => {
      const { id, name } = res.data;
      setOrganisationSaved({ id, name });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      toast.success(res.message || "Organization successfull created");
    },
    onError: (error: Error) => {
      toast.error(error.message);
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
