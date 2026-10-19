import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usePendingInviteRedirect } from "../usePendingInviteRedirect";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

describe("usePendingInviteRedirect", () => {
  beforeEach(() => {
    replace.mockReset();
    window.sessionStorage.clear();
  });

  it("sends a user who came from an invite link back to it", () => {
    window.sessionStorage.setItem("critiq.pendingInvite", "tok_1");
    const { result } = renderHook(() => usePendingInviteRedirect());

    expect(result.current).toBe(true);
    expect(replace).toHaveBeenCalledWith("/invite/tok_1");
  });

  it("does nothing without a pending invite", () => {
    const { result } = renderHook(() => usePendingInviteRedirect());

    expect(result.current).toBe(false);
    expect(replace).not.toHaveBeenCalled();
  });
});
