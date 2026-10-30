import { describe, expect, it } from "vitest";

import { isInviteToken, isResourceId } from "../id.helper";

describe("isResourceId", () => {
  it("accepts a cuid and a uuid", () => {
    expect(isResourceId("cmh1x2y3z4a5b6c7d8e9f0g1h")).toBe(true);
    expect(isResourceId("3f2b8c1e-9a4d-4e6f-8b2a-1c3d5e7f9a0b")).toBe(true);
  });

  it("rejects anything that could leave a path segment", () => {
    expect(isResourceId("../../x")).toBe(false);
    expect(isResourceId("cmh1x2y3z4a5b6c7d8e9f0g1h/merge")).toBe(false);
    expect(isResourceId("cmh1x2y3z4a5b6c7d8e9f0g1h?x")).toBe(false);
    expect(isResourceId("")).toBe(false);
    expect(isResourceId(null)).toBe(false);
    expect(isResourceId(undefined)).toBe(false);
  });
});

describe("isInviteToken", () => {
  it("accepts a 43-character base64url token", () => {
    expect(isInviteToken("aB3_-".repeat(8) + "xyz")).toBe(true);
  });

  it("rejects other lengths and characters", () => {
    expect(isInviteToken("a".repeat(42))).toBe(false);
    expect(isInviteToken("a".repeat(44))).toBe(false);
    expect(isInviteToken(`${"a".repeat(40)}../`)).toBe(false);
    expect(isInviteToken(null)).toBe(false);
  });
});
