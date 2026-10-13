import { renderHook } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import type { RealtimeStatus } from "@/lib/types/realtime.types";

import { useLivePollInterval } from "../useLivePollInterval";
import { RealtimeStatusContext } from "../useRealtimeStatus";

const withStatus = (status: RealtimeStatus) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <RealtimeStatusContext.Provider value={status}>
      {children}
    </RealtimeStatusContext.Provider>
  );
  return Wrapper;
};

describe("useLivePollInterval", () => {
  it("uses the safety net while the stream is open", () => {
    const { result } = renderHook(() => useLivePollInterval(), {
      wrapper: withStatus("open"),
    });

    expect(result.current.active(3000)).toBe(30_000);
    expect(result.current.idle(30_000)).toBe(false);
  });

  it("keeps today's intervals without a provider", () => {
    const { result } = renderHook(() => useLivePollInterval());

    expect(result.current.active(3000)).toBe(3000);
    expect(result.current.idle(30_000)).toBe(30_000);
  });
});
