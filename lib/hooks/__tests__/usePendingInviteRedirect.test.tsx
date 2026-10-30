import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usePendingInviteRedirect } from "../usePendingInviteRedirect";

const replace = vi.fn();
const TOKEN = "a".repeat(43);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

describe("usePendingInviteRedirect", () => {
  beforeEach(() => {
    replace.mockReset();
    window.sessionStorage.clear();
  });

  it("sends a user who came from an invite link back to it", () => {
    window.sessionStorage.setItem("critiq.pendingInvite", TOKEN);
    const { result } = renderHook(() => usePendingInviteRedirect());

    expect(result.current).toBe(true);
    expect(replace).toHaveBeenCalledWith(`/invite/${TOKEN}`);
  });

  it("drops a stored value that isn't an invite token instead of following it", () => {
    window.sessionStorage.setItem("critiq.pendingInvite", "../../orgs/x");
    const { result } = renderHook(() => usePendingInviteRedirect());

    expect(result.current).toBe(false);
    expect(replace).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem("critiq.pendingInvite")).toBeNull();
  });

  it("does nothing without a pending invite", () => {
    const { result } = renderHook(() => usePendingInviteRedirect());

    expect(result.current).toBe(false);
    expect(replace).not.toHaveBeenCalled();
  });
});
