import { useCallback, useSyncExternalStore } from "react";

const canMatchMedia = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function";

// Live result of a CSS media query. False on the server (and where
// matchMedia is missing), so the first client render matches the server HTML.
export const useMediaQuery = (query: string): boolean => {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!canMatchMedia()) return () => {};
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => canMatchMedia() && window.matchMedia(query).matches,
    () => false,
  );
};
