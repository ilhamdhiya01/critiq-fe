import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LAST_ORG_STORAGE_KEY } from "@/const/organization.constant";

import { readLastOrgSlug, saveLastOrgSlug } from "../last-org.helper";

describe("last-org.helper", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null before any org was visited", () => {
    expect(readLastOrgSlug()).toBeNull();
  });

  it("remembers the last visited org slug", () => {
    saveLastOrgSlug("acme");
    saveLastOrgSlug("globex");

    expect(readLastOrgSlug()).toBe("globex");
    expect(window.localStorage.getItem(LAST_ORG_STORAGE_KEY)).toBe("globex");
  });

  describe("when storage is unavailable", () => {
    it("reads null when accessing local storage throws", () => {
      vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
        throw new DOMException("The operation is insecure.", "SecurityError");
      });

      expect(readLastOrgSlug()).toBeNull();
      expect(() => saveLastOrgSlug("acme")).not.toThrow();
    });

    it("reads null when getItem throws", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("blocked");
      });

      expect(readLastOrgSlug()).toBeNull();
    });

    it("does not remember the slug when setItem throws", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      });

      expect(() => saveLastOrgSlug("acme")).not.toThrow();
      expect(readLastOrgSlug()).toBeNull();
    });
  });
});
