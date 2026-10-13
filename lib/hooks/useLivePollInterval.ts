import { useMemo } from "react";

import { getPollInterval } from "@/lib/helpers/realtime.helper";

import { useRealtimeStatus } from "./useRealtimeStatus";

// One place that decides how often data hooks poll, given the SSE stream:
// - active(ms): something is in flight (scan, AI, sync) — slows to a safety
//   net while the stream is open.
// - idle(ms): background refresh — off while the stream is open.
export const useLivePollInterval = () => {
  const status = useRealtimeStatus();

  return useMemo(
    () => ({
      active: (baseMs: number) => getPollInterval(status, "active", baseMs),
      idle: (baseMs: number) => getPollInterval(status, "idle", baseMs),
    }),
    [status],
  );
};
