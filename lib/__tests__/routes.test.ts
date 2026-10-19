import { describe, expect, it } from "vitest";

import { isPublicPath } from "@/routes";

describe("isPublicPath", () => {
  it("lets the invite page open without a session", () => {
    expect(isPublicPath("/invite/tok_123")).toBe(true);
    expect(isPublicPath("/login")).toBe(true);
  });

  it("keeps everything else private", () => {
    expect(isPublicPath("/invite")).toBe(false);
    expect(isPublicPath("/invite/tok/accept")).toBe(false);
    expect(isPublicPath("/acme/settings")).toBe(false);
    expect(isPublicPath("/")).toBe(false);
  });
});
