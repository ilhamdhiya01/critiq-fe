import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Role } from "@/lib/types/auth.types";
import type { OrgRules } from "@/lib/types/rules.types";
import { getOrgRules, updateRuleTier } from "@/services/rules.service";

import RulesView from "../RulesView";

let currentRole: Role = "ADMIN";

vi.mock("next/navigation", () => ({
  useParams: () => ({ slug: "acme" }),
}));

vi.mock("@/lib/hooks/organisation/useOrgBySlug", () => ({
  useOrgBySlug: () => ({ membership: { role: currentRole } }),
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
    { ...TIER("ci"), engine: "ci" },
  ],
  enabledCount: 6,
  totalCount: 7,
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
      <RulesView orgId="org_1" />
    </QueryClientProvider>,
  );

// First render in a cold worker can exceed the 5s default under load.
describe("RulesView", { timeout: 15_000 }, () => {
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
    expect(screen.getByText("6 dari 7 kategori aktif")).toBeTruthy();
    // The AI-only tiers carry the "Perlu AI" badge.
    expect(screen.getAllByText("Perlu AI")).toHaveLength(2);
    expect(screen.getAllByText("Static + AI")).toHaveLength(4);
    expect(screen.getAllByRole("switch")).toHaveLength(7);
    expect(
      screen.getByRole("switch", { name: /N\+1 & performa nonaktif/i }),
    ).toBeTruthy();
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
});
