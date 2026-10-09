import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import DiffErrorState from "../DiffErrorState";

describe("DiffErrorState", () => {
  it.each(["github_uninstalled", "github_suspended"])(
    "shows the GitHub access banner for 409 %s",
    (code) => {
      render(<DiffErrorState errorCode={code} />);
      expect(screen.getByRole("alert")).toHaveTextContent(
        "GitHub access was removed",
      );
      expect(screen.queryByText("Gagal memuat diff")).not.toBeInTheDocument();
    },
  );

  it("falls back to the generic error for other failures", () => {
    render(<DiffErrorState errorCode="provider_unreachable" />);
    expect(screen.getByText("Gagal memuat diff")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
