import { fireEvent, render, screen, within } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import PolicyRow from "../RepositoryDetail/PolicyRow";

const renderRow = (
  props: Partial<React.ComponentProps<typeof PolicyRow>> = {},
) => {
  const onPolicyChange = vi.fn();
  const onRemove = vi.fn();
  render(
    <PolicyRow
      row={{ branch: "develop", policy: "allow_ai" }}
      isDefault={false}
      isAdmin
      showPolicy
      onPolicyChange={onPolicyChange}
      onRemove={onRemove}
      {...props}
    />,
  );
  return { onPolicyChange, onRemove };
};

const policyGroup = () =>
  within(screen.getByRole("radiogroup", { name: "Review policy for develop" }));

describe("PolicyRow", () => {
  it("lets an Admin change this branch's policy", () => {
    const { onPolicyChange } = renderRow();

    expect(
      policyGroup().getByRole("radio", { name: "Allow AI" }),
    ).toHaveAttribute("aria-checked", "true");
    fireEvent.click(policyGroup().getByRole("radio", { name: "Require both" }));

    expect(onPolicyChange).toHaveBeenCalledWith("develop", "require_both");
  });

  it("lets an Admin stop monitoring a non-default branch", () => {
    const { onRemove } = renderRow();

    fireEvent.click(
      screen.getByRole("button", { name: "Stop monitoring develop" }),
    );

    expect(onRemove).toHaveBeenCalledWith("develop");
  });

  it("never lets the default branch be removed", () => {
    renderRow({
      row: { branch: "main", policy: "require_both" },
      isDefault: true,
    });

    expect(
      screen.queryByRole("button", { name: "Stop monitoring main" }),
    ).not.toBeInTheDocument();
  });

  // Reviewers and Viewers both arrive as isAdmin=false.
  it("is read-only for non-Admins: policy as text, no picker or remove", () => {
    renderRow({ isAdmin: false });

    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("Allow AI")).toBeInTheDocument();
  });

  it("shows the row's save error", () => {
    renderRow({ error: "Branch no longer exists in the repository." });

    expect(
      screen.getByText("Branch no longer exists in the repository."),
    ).toBeInTheDocument();
  });
});
