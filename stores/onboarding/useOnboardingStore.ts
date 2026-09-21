import { create } from "zustand";

interface Organisation {
  name: string;
  id: string | null;
  lastSavedName: string;
}

interface OnboardingState {
  organisation: Organisation;
}

interface OnboardingActions {
  setOrganisationName: (name: string) => void;
  setOrganisationSaved: (payload: { id: string; name: string }) => void;
  hydrateOrganisationId: (id: string) => void;
}

type OnboardingStore = OnboardingState & OnboardingActions;

const InitialState: OnboardingState = {
  organisation: { name: "", id: null, lastSavedName: "" },
};

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  ...InitialState,
  setOrganisationName: (name) =>
    set((state) => ({ organisation: { ...state.organisation, name } })),
  setOrganisationSaved: ({ id, name }) =>
    set((state) => ({
      organisation: { ...state.organisation, id, lastSavedName: name },
    })),
  hydrateOrganisationId: (id) =>
    set((state) => ({ organisation: { ...state.organisation, id } })),
}));
