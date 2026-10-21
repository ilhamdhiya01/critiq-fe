import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import Markdown from "../Markdown";

// Renders untrusted text from the AI summary and GitHub/GitLab comments.
describe("Markdown", () => {
  it("renders safe links with their href", () => {
    render(<Markdown>{"See [docs](https://example.com/a?b=1)."}</Markdown>);

    expect(screen.getByRole("link", { name: "docs" })).toHaveAttribute(
      "href",
      "https://example.com/a?b=1",
    );
  });

  it("strips javascript: URLs from links", () => {
    render(<Markdown>{"[click](javascript:alert(1))"}</Markdown>);

    const link = screen.getByText("click").closest("a");
    expect(link?.getAttribute("href") ?? "").not.toMatch(/javascript:/i);
  });

  it("does not render raw HTML", () => {
    const { container } = render(
      <Markdown>
        {
          '<img src="x" onerror="alert(1)" /> <script>alert(1)</script> <b>b</b>'
        }
      </Markdown>,
    );

    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(container.querySelector("script")).not.toBeInTheDocument();
    expect(container.querySelector("b")).not.toBeInTheDocument();
  });
});
