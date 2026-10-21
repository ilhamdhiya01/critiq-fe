import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import ConnectRepositoriesAction from "../ConnectRepositoriesAction";

// The real modal loads candidates; only open/close and its props matter here.
vi.mock("@/components/shared/connect-repositories-modal", () => ({
  default: ({
    orgId,
    provider,
    onClose,
  }: {
    orgId: string;
    provider: string;
    onClose: () => void;
  }) => (
    <div role="dialog" aria-label={`Connect ${provider} for ${orgId}`}>
      <button type="button" onClick={onClose}>
        Close modal
      </button>
    </div>
  ),
}));

describe("ConnectRepositoriesAction", () => {
  it("opens the modal for its org and provider, then closes it", () => {
    render(
      <ConnectRepositoriesAction
        orgId="org_1"
        provider="GITLAB"
        label="Add repository"
        variant="secondary"
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add repository" }));
    expect(
      screen.getByRole("dialog", { name: "Connect GITLAB for org_1" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close modal" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("stays closed while disabled and explains why", () => {
    render(
      <ConnectRepositoriesAction
        orgId="org_1"
        provider="GITHUB"
        label="Add repository"
        variant="ghost"
        disabled
        title="Only Admins can connect repositories"
      />,
    );
    const button = screen.getByRole("button", { name: "Add repository" });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute(
      "title",
      "Only Admins can connect repositories",
    );
    fireEvent.click(button);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
