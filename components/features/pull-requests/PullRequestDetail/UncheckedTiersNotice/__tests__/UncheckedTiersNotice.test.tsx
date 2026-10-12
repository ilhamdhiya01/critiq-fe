import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import type { AiSummaryStatus } from "@/lib/types/pull-request.types";

import UncheckedTiersNotice from "../UncheckedTiersNotice";

const renderNotice = (
  tiers: string[] | undefined,
  aiStatus: AiSummaryStatus | null = "skipped_manual_mode",
) =>
  render(
    <UncheckedTiersNotice
      tiers={tiers}
      aiStatus={aiStatus}
      rulesHref="/acme/rules"
      settingsHref="/acme/settings"
    />,
  );

describe("UncheckedTiersNotice", () => {
  it("names the tiers the scan did not check", () => {
    renderNotice(["breaking_change", "performance"]);

    expect(
      screen.getByText(/Kategori Breaking change, N\+1 & performa tidak dicek/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Atur quality profile" }),
    ).toHaveAttribute("href", "/acme/rules");
  });

  it("drops the removed CI tier from an older BE", () => {
    renderNotice(["ci", "performance"]);

    expect(screen.getByText(/Kategori N\+1 & performa tidak/)).toBeVisible();
    expect(screen.queryByText(/CI/)).not.toBeInTheDocument();
  });

  it("renders nothing when only unknown tiers or none were skipped", () => {
    const { container } = renderNotice(["ci"]);
    expect(container).toBeEmptyDOMElement();
  });

  it("stays hidden while the AI run is still in flight", () => {
    const { container } = renderNotice(["performance"], "running");
    expect(container).toBeEmptyDOMElement();
  });
});
