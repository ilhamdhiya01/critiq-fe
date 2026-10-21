import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PENDING_INVITE_STORAGE_KEY } from "@/const/member.constant";

import {
  clearPendingInvite,
  readPendingInvite,
  savePendingInvite,
} from "../invite.helper";

const blockStorage = () => {
  vi.spyOn(window, "sessionStorage", "get").mockImplementation(() => {
    throw new DOMException("The operation is insecure.", "SecurityError");
  });
};

describe("invite.helper", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null when no invite is pending", () => {
    expect(readPendingInvite()).toBeNull();
  });

  it("saves, reads and clears the pending invite token", () => {
    savePendingInvite("tok_1");
    expect(readPendingInvite()).toBe("tok_1");
    expect(window.sessionStorage.getItem(PENDING_INVITE_STORAGE_KEY)).toBe(
      "tok_1",
    );

    clearPendingInvite();
    expect(readPendingInvite()).toBeNull();
  });

  it("keeps only the latest invite token", () => {
    savePendingInvite("tok_1");
    savePendingInvite("tok_2");

    expect(readPendingInvite()).toBe("tok_2");
  });

  it("uses session storage, not local storage", () => {
    savePendingInvite("tok_1");

    expect(window.localStorage.getItem(PENDING_INVITE_STORAGE_KEY)).toBeNull();
  });

  describe("when storage is unavailable", () => {
    it("reads null instead of throwing", () => {
      blockStorage();

      expect(readPendingInvite()).toBeNull();
    });

    it("ignores save and clear instead of throwing", () => {
      blockStorage();

      expect(() => savePendingInvite("tok_1")).not.toThrow();
      expect(() => clearPendingInvite()).not.toThrow();
    });

    it("ignores a full storage quota on save", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      });

      expect(() => savePendingInvite("tok_1")).not.toThrow();
      expect(readPendingInvite()).toBeNull();
    });
  });
});
