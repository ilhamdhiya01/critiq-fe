import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  AiSettingsAdmin,
  AiSettingsMember,
} from "@/lib/types/ai-settings.types";
import { getAiSettings, listAiModels } from "@/services/ai-settings.service";

import AiProviderCard from "../AiProviderCard";

vi.mock("@/services/ai-settings.service", () => ({
  getAiSettings: vi.fn(),
  updateAiSettings: vi.fn(),
  testAiConnection: vi.fn(),
  listAiModels: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const ADMIN_SETTINGS: AiSettingsAdmin = {
  provider: "anthropic",
  model: "claude-sonnet-4",
  baseUrl: null,
  credentials: { anthropic: { hasKey: true, last4: "abcd" } },
  consent: {
    granted: true,
    at: "2026-10-01T03:00:00Z",
    by: { id: "u1", name: "Alex Winter" },
  },
  locale: "id",
  dailyTokenBudget: 100_000,
  providers: [
    {
      id: "anthropic",
      label: "Anthropic",
      available: true,
      defaultModel: "claude-sonnet-4",
    },
  ],
  lastTest: null,
};

const MEMBER_SETTINGS: AiSettingsMember = {
  provider: "anthropic",
  model: "claude-sonnet-4",
  consent: { granted: true },
  locale: "id",
};

const BLOCKED_NOTICE =
  "Review AI tidak berjalan sampai provider dan izin diatur.";

const renderCard = (orgId?: string) =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <AiProviderCard orgId={orgId} />
    </QueryClientProvider>,
  );

describe("AiProviderCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listAiModels).mockResolvedValue({
      data: {
        provider: "anthropic",
        source: "live",
        fetchedAt: "2026-10-21T00:00:00Z",
        warning: null,
        models: [],
      },
    });
  });

  it("gives Admins the editable form", async () => {
    vi.mocked(getAiSettings).mockResolvedValue({ data: ADMIN_SETTINGS });
    renderCard("org_1");

    expect(
      await screen.findByRole("button", { name: "Simpan" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anthropic" })).toBeVisible();
    expect(getAiSettings).toHaveBeenCalledWith("org_1");
    expect(screen.queryByText(BLOCKED_NOTICE)).not.toBeInTheDocument();
  });

  it("shows Reviewers/Viewers a read-only summary", async () => {
    vi.mocked(getAiSettings).mockResolvedValue({ data: MEMBER_SETTINGS });
    renderCard("org_1");

    expect(
      await screen.findByText("Hanya Admin yang bisa mengubah pengaturan AI."),
    ).toBeInTheDocument();
    expect(screen.getByText("Anthropic")).toBeInTheDocument();
    expect(screen.getByText("Diizinkan")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("warns that AI review is blocked without a provider", async () => {
    vi.mocked(getAiSettings).mockResolvedValue({
      data: { ...MEMBER_SETTINGS, provider: null, model: null },
    });
    renderCard("org_1");

    expect(await screen.findByRole("alert")).toHaveTextContent(BLOCKED_NOTICE);
  });

  it("warns that AI review is blocked without consent", async () => {
    vi.mocked(getAiSettings).mockResolvedValue({
      data: { ...ADMIN_SETTINGS, consent: { granted: false } },
    });
    renderCard("org_1");

    expect(await screen.findByText(BLOCKED_NOTICE)).toBeInTheDocument();
  });

  it("shows an error when the settings cannot be loaded", async () => {
    vi.mocked(getAiSettings).mockRejectedValue(new Error("boom"));
    renderCard("org_1");

    expect(
      await screen.findByText(
        "Gagal memuat pengaturan AI. Coba muat ulang halaman.",
      ),
    ).toBeInTheDocument();
  });

  it("does not fetch without an org", () => {
    renderCard(undefined);

    expect(screen.getByText(/Gagal memuat pengaturan AI/)).toBeInTheDocument();
    expect(getAiSettings).not.toHaveBeenCalled();
  });
});
