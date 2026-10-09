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
});
