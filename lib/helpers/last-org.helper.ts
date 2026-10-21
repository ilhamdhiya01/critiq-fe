import { LAST_ORG_STORAGE_KEY } from "@/const/organization.constant";

// Storage can be unavailable (private mode, blocked site data), so every
// access is guarded; losing it only means "/" falls back to another org.

export const readLastOrgSlug = (): string | null => {
  try {
    return window.localStorage.getItem(LAST_ORG_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const saveLastOrgSlug = (slug: string): void => {
  try {
    window.localStorage.setItem(LAST_ORG_STORAGE_KEY, slug);
  } catch {
    // Not remembered; "/" picks another org.
  }
};
