import { describe, expect, it } from "vitest";

import { getActivityNextPageParam } from "../useOrgActivity";

const page = (nextCursor: string | null) => ({
  data: {
    items: [],
    nextCursor,
    counts: { all: 0, approve: 0, request_changes: 0 },
  },
});

describe("getActivityNextPageParam", () => {
  it("passes the BE cursor through", () => {
    expect(getActivityNextPageParam(page("c_2"))).toBe("c_2");
  });

  it("stops once nextCursor is null", () => {
    expect(getActivityNextPageParam(page(null))).toBeUndefined();
  });
});
