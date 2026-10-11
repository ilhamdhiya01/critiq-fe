import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import type {
  AiSummaryStatus,
  PrQualityGate,
} from "@/lib/types/pull-request.types";

import QualityGateBanner from "../QualityGateBanner";

const BASE_GATE: PrQualityGate = {
  status: "passed",
  reasons: [],
  ci: "success",
  uncheckedTiers: [],
};

const renderBanner = (
  gate: Partial<PrQualityGate>,
  aiStatus?: AiSummaryStatus | null,
) =>
  render(
    <QualityGateBanner
      gate={{ ...BASE_GATE, ...gate }}
      rulesHref="/acme/rules"
      settingsHref="/acme/settings"
      aiStatus={aiStatus}
    />,
  );

describe("QualityGateBanner", () => {
  it("shows the passed label and green CI chip without any reasons", () => {
    renderBanner({ status: "passed", ci: "success" });

    expect(screen.getByText("Lolos")).toBeInTheDocument();
    expect(screen.getByText("CI: hijau")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows the failed label with every applicable reason", () => {
    renderBanner({
      status: "failed",
      reasons: ["critical_findings", "ci_failed"],
      ci: "failure",
    });

    expect(screen.getByText("Gagal")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/Ada temuan Critical aktif/)).toBeInTheDocument();
    expect(screen.getByText(/CI gagal/)).toBeInTheDocument();
    expect(screen.getByText("CI: merah")).toBeInTheDocument();
  });

  it("shows the pending label with running-scan and running-CI reasons", () => {
    renderBanner({
      status: "pending",
      reasons: ["scan_running", "ci_running"],
      ci: "pending",
    });

    expect(screen.getByText("Menunggu")).toBeInTheDocument();
    expect(screen.getByText(/Scan sedang berjalan/)).toBeInTheDocument();
    expect(screen.getByText(/CI masih berjalan/)).toBeInTheDocument();
    expect(screen.getByText("CI: berjalan")).toBeInTheDocument();
  });

  it("keeps the gate passed when CI is simply not detected", () => {
    renderBanner({
      status: "passed",
      reasons: ["ci_not_detected"],
      ci: "none",
    });

    expect(screen.getByText("Lolos")).toBeInTheDocument();
    expect(screen.queryByText("Gagal")).not.toBeInTheDocument();
    expect(screen.getByText(/CI tidak terdeteksi/)).toBeInTheDocument();
    expect(screen.getByText("CI: tidak ada")).toBeInTheDocument();
  });

  it("shows the unchecked-tier notice only when tiers were skipped", () => {
    renderBanner({ uncheckedTiers: ["secrets", "performance"] }, undefined);

    expect(
      screen.getByText(/Kategori Secrets, N\+1 & performa tidak dicek/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Atur quality profile" }),
    ).toHaveAttribute("href", "/acme/rules");
  });

  it("renders no unchecked-tier notice when every tier was checked", () => {
    renderBanner({ uncheckedTiers: [] });

    expect(screen.queryByText(/tidak dicek/)).not.toBeInTheDocument();
  });

  it("links the banner to the rules page", () => {
    renderBanner({});

    expect(
      screen.getByRole("link", { name: "Lihat quality profile" }),
    ).toHaveAttribute("href", "/acme/rules");
  });

  it.each(["queued", "running"] as const)(
    "hides the unchecked-tier notice while the AI run is %s",
    (aiStatus) => {
      renderBanner(
        { uncheckedTiers: ["breaking_change", "performance"] },
        aiStatus,
      );

      expect(screen.queryByText(/tidak dicek/)).not.toBeInTheDocument();
    },
  );

  it("explains a Manual-only branch and links to the quality profile", () => {
    renderBanner(
      { uncheckedTiers: ["breaking_change"] },
      "skipped_manual_mode",
    );

    expect(
      screen.getByText(/tidak dicek karena branch ini memakai Manual review/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Atur quality profile" }),
    ).toHaveAttribute("href", "/acme/rules");
  });

  it("points an unconfigured provider at settings, not the rules page", () => {
    renderBanner({ uncheckedTiers: ["performance"] }, "not_configured");

    expect(
      screen.getByText(/AI provider belum dikonfigurasi/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Atur AI provider" }),
    ).toHaveAttribute("href", "/acme/settings");
  });

  it("offers no link when the AI run failed", () => {
    renderBanner({ uncheckedTiers: ["performance"] }, "failed");

    expect(
      screen.getByText(/AI review gagal pada scan ini/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Atur/ }),
    ).not.toBeInTheDocument();
  });
});
