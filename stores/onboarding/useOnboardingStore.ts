import { create } from "zustand";

interface Organisation {
  name: string;
  id: string | null;
  slug: string | null;
  lastSavedName: string;
}

interface OnboardingState {
  organisation: Organisation;
}

interface OnboardingActions {
  setOrganisationName: (name: string) => void;
  setOrganisationSaved: (payload: {
    id: string;
    name: string;
    slug: string;
  }) => void;
  hydrateOrganisationId: (id: string) => void;
  // Fresh wizard for a new organization.
  reset: () => void;
}

type OnboardingStore = OnboardingState & OnboardingActions;

const InitialState: OnboardingState = {
  organisation: { name: "", id: null, slug: null, lastSavedName: "" },
};

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  ...InitialState,
  setOrganisationName: (name) =>
    set((state) => ({ organisation: { ...state.organisation, name } })),
  setOrganisationSaved: ({ id, name, slug }) =>
    set((state) => ({
      organisation: { ...state.organisation, id, slug, lastSavedName: name },
    })),
  hydrateOrganisationId: (id) =>
    set((state) => ({ organisation: { ...state.organisation, id } })),
  reset: () => set(InitialState),
}));
