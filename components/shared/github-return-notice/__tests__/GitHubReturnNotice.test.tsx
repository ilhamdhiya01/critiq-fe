import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "@/lib/toast";

import GitHubReturnNotice from "../GitHubReturnNotice";

const replace = vi.fn();
let search = "";
let pathname = "/acme/settings";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => pathname,
  useSearchParams: () => new URLSearchParams(search),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const renderNotice = () => {
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  render(
    <QueryClientProvider client={client}>
      <GitHubReturnNotice />
    </QueryClientProvider>,
  );
  return { invalidate };
};

describe("GitHubReturnNotice", () => {
  beforeEach(() => {
    replace.mockReset();
    vi.mocked(toast.info).mockReset();
  });

  it("explains a pending owner approval in Settings and drops the param", async () => {
    pathname = "/acme/settings";
    search = "github=pending_approval";
    const { invalidate } = renderNotice();

    await waitFor(() =>
      expect(toast.info).toHaveBeenCalledWith(
        "Request sent. A GitHub organization owner needs to approve the Critiq app. Then click Connect GitHub again.",
      ),
    );
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["integrations"] });
    expect(replace).toHaveBeenCalledWith("/acme/settings", { scroll: false });
  });

  it("keeps the wizard's other params when returning to onboarding", async () => {
    pathname = "/setup";
    search = "step=2&orgId=org_1&github=pending_approval";
    renderNotice();

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/setup?step=2&orgId=org_1", {
        scroll: false,
      }),
    );
    expect(toast.info).toHaveBeenCalledTimes(1);
  });

  it("does nothing without the param", () => {
    pathname = "/acme/settings";
    search = "";
    renderNotice();

    expect(toast.info).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });
});
