import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import Badge from "../Badge";

describe("Badge", () => {
  it("applies the tone colours", () => {
    render(<Badge tone="green">Connected</Badge>);

    expect(screen.getByText("Connected")).toHaveClass(
      "rounded-full",
      "text-success-light",
    );
  });

  it("uses a palette from the status maps instead of a tone", () => {
    render(
      <Badge
        palette={{
          text: "text-danger-light",
          bg: "bg-danger/10",
          border: "border-danger/40",
        }}
      >
        CRITICAL
      </Badge>,
    );

    const badge = screen.getByText("CRITICAL");
    expect(badge).toHaveClass("text-danger-light", "bg-danger/10");
    expect(badge).not.toHaveClass("text-neutral-400");
  });

  it("renders a tag shape for metadata chips", () => {
    render(
      <Badge tone="neutral" shape="tag" weight="normal">
        default: main
      </Badge>,
    );

    expect(screen.getByText("default: main")).toHaveClass(
      "rounded-md",
      "font-normal",
    );
  });

  it("never shrinks by default", () => {
    render(<Badge tone="neutral">feat/very-long-branch</Badge>);

    const badge = screen.getByText("feat/very-long-branch");
    expect(badge).toHaveClass("shrink-0");
    expect(badge).not.toHaveClass("min-w-0");
  });

  it("can shrink and ellipsize long text when asked to", () => {
    render(
      <Badge tone="neutral" truncate>
        acme/platform/services/payments
      </Badge>,
    );

    const text = screen.getByText("acme/platform/services/payments");
    expect(text).toHaveClass("truncate");
    const badge = text.parentElement;
    expect(badge).toHaveClass("max-w-full", "min-w-0");
    expect(badge).not.toHaveClass("shrink-0");
  });
});
