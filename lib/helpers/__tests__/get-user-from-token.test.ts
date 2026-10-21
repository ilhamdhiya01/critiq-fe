import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getUserFromToken } from "..";

const cookieStore = { get: vi.fn() };

vi.mock("next/headers", () => ({
  cookies: async () => cookieStore,
}));

// Unsigned JWT: header.payload.signature, base64url-encoded.
const encode = (value: object) =>
  btoa(JSON.stringify(value))
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const PAYLOAD = {
  sub: "u_1",
  activeOrgId: "org_1",
  role: "ADMIN",
  provider: "GITHUB",
  onboardingCompleted: true,
};

const TOKEN = `${encode({ alg: "HS256", typ: "JWT" })}.${encode(PAYLOAD)}.sig`;

describe("getUserFromToken", () => {
  beforeEach(() => {
    cookieStore.get.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("decodes the session cookie", async () => {
    cookieStore.get.mockReturnValue({ value: TOKEN });

    await expect(getUserFromToken()).resolves.toEqual(PAYLOAD);
    expect(cookieStore.get).toHaveBeenCalledWith("session");
  });

  it("returns null without a session cookie", async () => {
    cookieStore.get.mockReturnValue(undefined);

    await expect(getUserFromToken()).resolves.toBeNull();
  });

  it("returns null for an empty session cookie", async () => {
    cookieStore.get.mockReturnValue({ value: "" });

    await expect(getUserFromToken()).resolves.toBeNull();
  });

  it("returns null and logs for a malformed token", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    cookieStore.get.mockReturnValue({ value: "not-a-jwt" });

    await expect(getUserFromToken()).resolves.toBeNull();
    expect(consoleError).toHaveBeenCalled();
  });
});
