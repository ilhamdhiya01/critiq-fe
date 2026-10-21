import { beforeEach, describe, expect, it } from "vitest";

import { useOnboardingStore } from "../useOnboardingStore";

const EMPTY_ORGANISATION = {
  name: "",
  id: null,
  slug: null,
  lastSavedName: "",
};

describe("useOnboardingStore", () => {
  beforeEach(() => {
    useOnboardingStore.getState().reset();
  });

  it("starts with an empty organisation", () => {
    expect(useOnboardingStore.getState().organisation).toEqual(
      EMPTY_ORGANISATION,
    );
  });

  it("updates the typed name without marking it saved", () => {
    useOnboardingStore.getState().setOrganisationName("Acme");

    expect(useOnboardingStore.getState().organisation).toEqual({
      ...EMPTY_ORGANISATION,
      name: "Acme",
    });
  });

  it("records the saved organisation and keeps the typed name", () => {
    const { setOrganisationName, setOrganisationSaved } =
      useOnboardingStore.getState();

    setOrganisationName("Acme Inc");
    setOrganisationSaved({ id: "org_1", name: "Acme", slug: "acme" });

    expect(useOnboardingStore.getState().organisation).toEqual({
      name: "Acme Inc",
      id: "org_1",
      slug: "acme",
      lastSavedName: "Acme",
    });
  });

  it("hydrates only the organisation id", () => {
    const { setOrganisationName, hydrateOrganisationId } =
      useOnboardingStore.getState();

    setOrganisationName("Acme");
    hydrateOrganisationId("org_9");

    expect(useOnboardingStore.getState().organisation).toEqual({
      ...EMPTY_ORGANISATION,
      name: "Acme",
      id: "org_9",
    });
  });

  it("resets to a fresh wizard but keeps the actions", () => {
    const store = useOnboardingStore.getState();
    store.setOrganisationSaved({ id: "org_1", name: "Acme", slug: "acme" });

    store.reset();

    expect(useOnboardingStore.getState().organisation).toEqual(
      EMPTY_ORGANISATION,
    );
    useOnboardingStore.getState().setOrganisationName("Globex");
    expect(useOnboardingStore.getState().organisation.name).toBe("Globex");
  });
});
