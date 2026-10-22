import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getUserFromToken } from "@/lib/helpers";
import { config, proxy } from "@/proxy";

vi.mock("@/lib/helpers", () => ({
  getUserFromToken: vi.fn(),
}));

const TOKEN = {
  sub: "u1",
  activeOrgId: "org_1",
  role: "ADMIN" as const,
  provider: "GITHUB" as const,
  onboardingCompleted: true,
};

const visit = (path: string) =>
  proxy(new NextRequest(new URL(path, "http://localhost:3000")));

const redirectedTo = (response: Response) => {
  const location = response.headers.get("location");
  return location
    ? new URL(location).pathname + new URL(location).search
    : null;
};

describe("proxy", () => {
  beforeEach(() => {
    vi.mocked(getUserFromToken).mockReset();
  });

  it("lets a user whose org is set up open the new-org wizard and /setup", async () => {
    vi.mocked(getUserFromToken).mockResolvedValue(TOKEN);

    expect(redirectedTo(await visit("/organizations/new"))).toBeNull();
    expect(redirectedTo(await visit("/setup?step=2&orgId=org_2"))).toBeNull();
    expect(redirectedTo(await visit("/acme"))).toBeNull();
  });

  it("never routes on the token's onboardingCompleted", async () => {
    vi.mocked(getUserFromToken).mockResolvedValue({
      ...TOKEN,
      onboardingCompleted: false,
    });

    expect(redirectedTo(await visit("/acme/pull-requests"))).toBeNull();
  });

  it("sends a user without any org to /setup", async () => {
    vi.mocked(getUserFromToken).mockResolvedValue({
      ...TOKEN,
      activeOrgId: null,
      onboardingCompleted: false,
    });

    expect(redirectedTo(await visit("/acme"))).toBe("/setup");
    expect(redirectedTo(await visit("/organizations/new"))).toBe("/setup");
    expect(redirectedTo(await visit("/setup"))).toBeNull();
  });

  it("sends anonymous visitors to login and signed-in ones away from it", async () => {
    vi.mocked(getUserFromToken).mockResolvedValue(null);
    expect(redirectedTo(await visit("/organizations/new"))).toBe(
      "/login?callbackUrl=%2Forganizations%2Fnew",
    );

    vi.mocked(getUserFromToken).mockResolvedValue(TOKEN);
    expect(redirectedTo(await visit("/login"))).toBe("/");
  });

  it("leaves static assets such as the favicon out of the auth check", () => {
    const matcher = new RegExp(`^${config.matcher[0]}$`);

    expect(matcher.test("/icon.svg")).toBe(false);
    expect(matcher.test("/favicon.ico")).toBe(false);
    expect(matcher.test("/_next/static/chunk.js")).toBe(false);
    expect(matcher.test("/login")).toBe(true);
    expect(matcher.test("/acme/settings")).toBe(true);
  });
});
