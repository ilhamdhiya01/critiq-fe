import { describe, expect, it } from "vitest";

import type { MembershipWithOrg } from "@/lib/types/membership.type";

import {
  getOrgSwitchHref,
  pickExitMembership,
  pickLandingMembership,
} from "../organization.helper";

const member = (
  slug: string,
  onboardingCompleted = true,
): MembershipWithOrg => ({
  id: `m_${slug}`,
  userId: "u1",
  organizationId: `org_${slug}`,
  role: "ADMIN",
  status: "ACTIVE",
  organization: {
    id: `org_${slug}`,
    name: slug,
    slug,
    createdBy: "u1",
    onboardingCompleted,
  },
});

const DRAFT = member("draft", false);
const ACME = member("acme");
const BETA = member("beta");

describe("pickLandingMembership", () => {
  it("prefers the last org opened while still a member", () => {
    expect(pickLandingMembership([DRAFT, ACME, BETA], "beta")).toBe(BETA);
  });

  it("then the first org whose setup is done", () => {
    expect(pickLandingMembership([DRAFT, ACME, BETA], "gone")).toBe(ACME);
    expect(pickLandingMembership([DRAFT, ACME], null)).toBe(ACME);
  });

  it("then the first org, and null without any", () => {
    expect(pickLandingMembership([DRAFT], null)).toBe(DRAFT);
    expect(pickLandingMembership([], "acme")).toBeNull();
  });
});

describe("pickExitMembership", () => {
  it("leaves for the last org opened, finished or not, never the one being set up", () => {
    expect(pickExitMembership([DRAFT, ACME, BETA], "beta", null)).toBe(BETA);
    expect(pickExitMembership([DRAFT, ACME, BETA], "draft", null)).toBe(DRAFT);
    expect(pickExitMembership([ACME, BETA], "acme", "org_acme")).toBe(BETA);
  });

  it("falls back to the first other org, or nothing", () => {
    expect(pickExitMembership([DRAFT, ACME], "gone", null)).toBe(DRAFT);
    expect(pickExitMembership([DRAFT], null, "org_draft")).toBeNull();
    expect(pickExitMembership([], null, null)).toBeNull();
  });
});

describe("getOrgSwitchHref", () => {
  it("stays in the same menu in the other org", () => {
    expect(getOrgSwitchHref("/acme/settings", "beta")).toBe("/beta/settings");
    expect(getOrgSwitchHref("/acme/rules", "beta")).toBe("/beta/rules");
    expect(getOrgSwitchHref("/acme/insights", "beta")).toBe("/beta/insights");
  });

  it("goes to the menu's list from a detail page of the old org", () => {
    expect(getOrgSwitchHref("/acme/pull-requests/pr_1", "beta")).toBe(
      "/beta/pull-requests",
    );
    expect(getOrgSwitchHref("/acme/repositories/repo_1", "beta")).toBe(
      "/beta/repositories",
    );
  });

  it("falls back to the dashboard", () => {
    expect(getOrgSwitchHref("/acme", "beta")).toBe("/beta");
    expect(getOrgSwitchHref("/acme/unknown", "beta")).toBe("/beta");
    expect(getOrgSwitchHref("/", "beta")).toBe("/beta");
  });
});
