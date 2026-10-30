import { describe, expect, it } from "vitest";

import { apiOriginOf, buildCsp, createNonce } from "../csp.helper";

describe("buildCsp", () => {
  it("allows only this origin, the nonce and the avatar hosts", () => {
    const csp = buildCsp({ nonce: "abc", apiOrigin: null, isDev: false });

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'nonce-abc' 'strict-dynamic'");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).toContain("connect-src 'self';");
    expect(csp).toContain("https://avatars.githubusercontent.com");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it("lets an absolute API origin through and allows eval only in dev", () => {
    const csp = buildCsp({
      nonce: "abc",
      apiOrigin: "http://localhost:3001",
      isDev: true,
    });

    expect(csp).toContain("connect-src 'self' http://localhost:3001");
    expect(csp).toContain("'unsafe-eval'");
  });
});

describe("apiOriginOf", () => {
  it("is the origin of an absolute URL and null for a relative path", () => {
    expect(apiOriginOf("http://localhost:3001/api/v1")).toBe(
      "http://localhost:3001",
    );
    expect(apiOriginOf("/api/v1")).toBeNull();
    expect(apiOriginOf(undefined)).toBeNull();
  });
});

describe("createNonce", () => {
  it("is different every time", () => {
    expect(createNonce()).not.toBe(createNonce());
  });
});
