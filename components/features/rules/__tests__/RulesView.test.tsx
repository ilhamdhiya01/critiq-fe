import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ActiveOrgTestProvider from "@/lib/test-utils/ActiveOrgTestProvider";
import type { Role } from "@/lib/types/auth.types";
import type { OrgRules } from "@/lib/types/rules.types";
import { getOrgRules, updateRuleTier } from "@/services/rules.service";

import RulesView from "../RulesView";

let currentRole: Role = "ADMIN";

let tierParam: string | null = null;
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ slug: "acme" }),
  useRouter: () => ({ replace }),
  usePathname: () => "/acme/rules",
  useSearchParams: () =>
    new URLSearchParams(tierParam ? { tier: tierParam } : {}),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

vi.mock("@/services/rules.service", () => ({
  getOrgRules: vi.fn(),
  updateRuleTier: vi.fn(),
}));

const TIER = (
  id: OrgRules["tiers"][number]["id"],
  enabled = true,
): OrgRules["tiers"][number] => ({
  id,
  enabled,
  engine: "static+ai",
  requiresAi: false,
  staticRules: [],
  aiCategories: [],
});

const RULES: OrgRules = {
  tiers: [
    TIER("secrets"),
    TIER("crash"),
    { ...TIER("breaking_change"), engine: "ai", requiresAi: true },
    TIER("error_handling"),
    { ...TIER("performance", false), engine: "ai", requiresAi: true },
    TIER("security"),
  ],
  enabledCount: 5,
  totalCount: 6,
  updatedAt: "2026-10-12T03:00:00Z",
  updatedBy: "user_1",
};

const renderView = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <ActiveOrgTestProvider orgId="org_1" role={currentRole}>
        <RulesView />
      </ActiveOrgTestProvider>
    </QueryClientProvider>,
  );

describe("RulesView", () => {
  beforeEach(() => {
    currentRole = "ADMIN";
    vi.clearAllMocks();
    vi.mocked(getOrgRules).mockResolvedValue({ data: RULES });
    vi.mocked(updateRuleTier).mockResolvedValue({ data: RULES });
  });

  it("lists every tier with its engine and state", async () => {
    renderView();
    expect(await screen.findByText("Secrets")).toBeTruthy();
    expect(screen.getByText("Kerentanan keamanan")).toBeTruthy();
    expect(screen.getByText("5 dari 6 kategori aktif")).toBeTruthy();
    expect(screen.queryByText("CI gagal")).toBeNull();
    // The AI-only tiers carry the "Perlu AI" badge.
    expect(screen.getAllByText("Perlu AI")).toHaveLength(2);
    expect(screen.getAllByText("Static + AI")).toHaveLength(4);
    expect(screen.getAllByRole("switch")).toHaveLength(6);
    expect(
      screen.getByRole("switch", { name: /N\+1 & performa nonaktif/i }),
    ).toBeTruthy();
  });

  it("drops the removed CI tier when an older BE still sends it", async () => {
    vi.mocked(getOrgRules).mockResolvedValue({
      data: {
        ...RULES,
        tiers: [
          ...RULES.tiers,
          {
            ...TIER("secrets"),
            id: "ci",
            engine: "ci",
          } as unknown as OrgRules["tiers"][number],
        ],
        enabledCount: 6,
        totalCount: 7,
      },
    });
    renderView();

    expect(await screen.findByText("Secrets")).toBeTruthy();
    expect(screen.queryByText("CI gagal")).toBeNull();
    expect(screen.getAllByRole("switch")).toHaveLength(6);
    // Counted from the tiers shown, not the BE's totals.
    expect(screen.getByText("5 dari 6 kategori aktif")).toBeTruthy();
  });

  it("lets an Admin toggle a tier", async () => {
    renderView();
    fireEvent.click(
      await screen.findByRole("switch", { name: /Secrets aktif/i }),
    );
    await waitFor(() =>
      expect(updateRuleTier).toHaveBeenCalledWith("org_1", {
        tier: "secrets",
        enabled: false,
      }),
    );
  });

  it("shows read-only switches to a non-Admin", async () => {
    currentRole = "VIEWER";
    renderView();
    await screen.findByText("Secrets");
    for (const sw of screen.getAllByRole("switch")) {
      expect((sw as HTMLButtonElement).disabled).toBe(true);
    }
    expect(
      screen.getByText(/Hanya Admin yang bisa mengubah quality profile/i),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("switch", { name: /Secrets aktif/i }));
    expect(updateRuleTier).not.toHaveBeenCalled();
  });

  it("rolls the switch back when the update fails", async () => {
    vi.mocked(updateRuleTier).mockRejectedValue(new Error("forbidden"));
    renderView();
    const secrets = await screen.findByRole("switch", {
      name: /Secrets aktif/i,
    });
    fireEvent.click(secrets);
    await waitFor(() =>
      expect(secrets.getAttribute("aria-checked")).toBe("true"),
    );
  });

  it("shows an error state when the profile cannot be loaded", async () => {
    vi.mocked(getOrgRules).mockRejectedValue(new Error("boom"));
    renderView();
    expect(
      await screen.findByText("Gagal memuat quality profile"),
    ).toBeTruthy();
  });

  it("scrolls to and briefly highlights the tier opened from search", async () => {
    vi.mocked(getOrgRules).mockResolvedValue({ data: RULES });
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    tierParam = "breaking_change";
    vi.useFakeTimers({ shouldAdvanceTime: true });

    try {
      renderView();

      await waitFor(() =>
        expect(
          document.getElementById("rule-tier-breaking_change"),
        ).toHaveAttribute("data-highlighted"),
      );
      expect(scrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({ block: "center" }),
      );
      expect(document.getElementById("rule-tier-secrets")).not.toHaveAttribute(
        "data-highlighted",
      );

      // The param is dropped afterwards so the same search highlights again.
      act(() => vi.advanceTimersByTime(2000));
      expect(replace).toHaveBeenCalledWith("/acme/rules", { scroll: false });
    } finally {
      vi.useRealTimers();
      tierParam = null;
    }
  });

  it("ignores an unknown tier param", async () => {
    vi.mocked(getOrgRules).mockResolvedValue({ data: RULES });
    tierParam = "ci";

    try {
      renderView();
      await screen.findByText("Secrets");

      expect(document.querySelector("[data-highlighted]")).toBeNull();
    } finally {
      tierParam = null;
    }
  });
});
