import { describe, expect, it } from "vitest";

import {
  getRuleTierElementId,
  isKnownRuleTier,
  RULE_TIER_IDS,
} from "../rules.constant";

describe("rules.constant", () => {
  describe("isKnownRuleTier", () => {
    it.each(RULE_TIER_IDS)("accepts the current tier %s", (tier) => {
      expect(isKnownRuleTier(tier)).toBe(true);
    });

    it("rejects tiers removed from the BE and unknown ids", () => {
      expect(isKnownRuleTier("ci")).toBe(false);
      expect(isKnownRuleTier("")).toBe(false);
      expect(isKnownRuleTier("Secrets")).toBe(false);
    });

    it("rejects object prototype keys (e.g. from ?tier=)", () => {
      expect(isKnownRuleTier("constructor")).toBe(false);
      expect(isKnownRuleTier("toString")).toBe(false);
      expect(isKnownRuleTier("__proto__")).toBe(false);
    });
  });

  describe("getRuleTierElementId", () => {
    it("prefixes the tier id", () => {
      expect(getRuleTierElementId("secrets")).toBe("rule-tier-secrets");
      expect(getRuleTierElementId("breaking_change")).toBe(
        "rule-tier-breaking_change",
      );
    });
  });
});
