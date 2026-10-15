import { createContext, useContext } from "react";

import type { RealtimeStatus } from "@/lib/types/realtime.types";

// Provided by RealtimeProvider (app/[slug]/layout.tsx). Without it — e.g.
// onboarding or tests — realtime is simply unavailable and polling stays.
export const RealtimeStatusContext =
  createContext<RealtimeStatus>("unavailable");

export const useRealtimeStatus = (): RealtimeStatus =>
  useContext(RealtimeStatusContext);
