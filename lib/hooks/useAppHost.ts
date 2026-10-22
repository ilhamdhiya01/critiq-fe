import { useSyncExternalStore } from "react";

// The host never changes while the page is open.
const subscribe = () => () => {};

// Host the app is served from ("critiq-dev.web.id", "localhost:3000"), so
// org URLs shown in the UI match the actual deployment. Empty on the server,
// so the first client render matches the server HTML.
export const useAppHost = (): string =>
  useSyncExternalStore(
    subscribe,
    () => window.location.host,
    () => "",
  );
