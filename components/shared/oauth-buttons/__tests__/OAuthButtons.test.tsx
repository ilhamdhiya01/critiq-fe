import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { API_OAUTH_LOGIN } from "@/routes";

import OAuthButtons from "../OAuthButtons";

describe("OAuthButtons", () => {
  it("sends each provider to its BE OAuth endpoint", () => {
    render(<OAuthButtons />);

    expect(
      screen.getByRole("link", { name: "Continue with GitHub" }),
    ).toHaveAttribute("href", API_OAUTH_LOGIN("github"));
    expect(
      screen.getByRole("link", { name: "Continue with GitLab.com" }),
    ).toHaveAttribute("href", API_OAUTH_LOGIN("gitlab"));
  });

  it("locks the other provider once one is pressed", () => {
    render(<OAuthButtons />);
    const github = screen.getByRole("link", { name: "Continue with GitHub" });
    const gitlab = screen.getByRole("link", {
      name: "Continue with GitLab.com",
    });

    // Keeps jsdom from attempting a real navigation.
    gitlab.addEventListener("click", (event) => event.preventDefault(), {
      once: true,
    });
    fireEvent.click(gitlab);

    expect(gitlab.querySelector(".animate-spin")).toBeInTheDocument();
    expect(gitlab).not.toHaveAttribute("aria-disabled");
    expect(github).toHaveAttribute("aria-disabled", "true");
  });
});
