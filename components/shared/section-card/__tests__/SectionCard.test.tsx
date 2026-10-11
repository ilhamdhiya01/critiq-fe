import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import SectionCard from "../SectionCard";

describe("SectionCard", () => {
  it("renders the title with count and meta", () => {
    render(
      <SectionCard title="Pull Requests" count={2} meta="2 monitored">
        <p>body</p>
      </SectionCard>,
    );

    expect(
      screen.getByRole("heading", { name: /Pull Requests\s*\(2\)/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 monitored")).toBeInTheDocument();
    expect(screen.getByText("body")).toBeInTheDocument();
  });

  it("colours the count red for critical sections", () => {
    render(
      <SectionCard title="Flagged Issues" count={3} countTone="danger">
        <p>body</p>
      </SectionCard>,
    );

    expect(screen.getByText(/\(3\)/)).toHaveClass("text-danger-light");
  });

  it("omits the header when there is no title or meta", () => {
    render(
      <SectionCard>
        <p>body</p>
      </SectionCard>,
    );

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });
});
