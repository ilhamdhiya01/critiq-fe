import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import Markdown from "../Markdown";

// Renders untrusted text from the AI summary and GitHub/GitLab comments.
describe("Markdown", () => {
  it("renders safe links in a new tab without leaking the opener or referrer", () => {
    render(<Markdown>{"See [docs](https://example.com/a?b=1)."}</Markdown>);

    const link = screen.getByRole("link", { name: "docs" });
    expect(link).toHaveAttribute("href", "https://example.com/a?b=1");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer nofollow");
  });

  it("renders a javascript: link as plain text", () => {
    render(<Markdown>{"[click](javascript:alert(1))"}</Markdown>);

    expect(screen.getByText("click").closest("a")).toBeNull();
  });

  it("turns images into a text link, so nothing is fetched", () => {
    const { container } = render(
      <Markdown>{"![tracking pixel](https://example.com/a.png)"}</Markdown>,
    );

    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "tracking pixel" }),
    ).toHaveAttribute("href", "https://example.com/a.png");
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
