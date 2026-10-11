import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import type { PrQualityGate } from "@/lib/types/pull-request.types";

import QualityGateBanner from "../QualityGateBanner";

const BASE_GATE: PrQualityGate = {
  status: "passed",
  reasons: [],
  ci: "success",
  uncheckedTiers: [],
};

const renderBanner = (gate: Partial<PrQualityGate>) =>
  render(
    <QualityGateBanner
      gate={{ ...BASE_GATE, ...gate }}
      rulesHref="/acme/rules"
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
    renderBanner({ uncheckedTiers: ["secrets", "performance"] });

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
});
