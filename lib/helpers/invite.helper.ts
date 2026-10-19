import { PENDING_INVITE_STORAGE_KEY } from "@/const/member.constant";

// The pending invite survives the OAuth round trip (same tab) so login comes
// back to the invite page. Storage can be unavailable (private mode), so
// every access is guarded.

export const readPendingInvite = (): string | null => {
  try {
    return window.sessionStorage.getItem(PENDING_INVITE_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const savePendingInvite = (token: string): void => {
  try {
    window.sessionStorage.setItem(PENDING_INVITE_STORAGE_KEY, token);
  } catch {
    // The user can reopen the link after signing in.
  }
};

export const clearPendingInvite = (): void => {
  try {
    window.sessionStorage.removeItem(PENDING_INVITE_STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
};
