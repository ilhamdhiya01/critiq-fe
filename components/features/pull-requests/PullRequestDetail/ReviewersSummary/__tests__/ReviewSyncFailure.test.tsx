import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import ReviewSyncFailure from "../ReviewSyncFailure";

const renderFailure = (
  props: Partial<React.ComponentProps<typeof ReviewSyncFailure>> = {},
) => {
  const onRetry = vi.fn();
  render(
    <ReviewSyncFailure
      reviewId="rev_1"
      reviewerName="Maya"
      error={null}
      providerName="GitLab"
      canRetry
      isRetrying={false}
      onRetry={onRetry}
      {...props}
    />,
  );
  return { onRetry };
};

describe("ReviewSyncFailure", () => {
  it("retries this review", () => {
    const { onRetry } = renderFailure();

    fireEvent.click(screen.getByRole("button", { name: "Retry sync" }));

    expect(onRetry).toHaveBeenCalledWith("rev_1");
  });

  it("disables the retry while it runs", () => {
    renderFailure({ isRetrying: true });

    expect(screen.getByRole("button", { name: "Retry sync" })).toBeDisabled();
  });

  it("offers no retry without permission", () => {
    renderFailure({ canRetry: false });

    expect(
      screen.queryByRole("button", { name: "Retry sync" }),
    ).not.toBeInTheDocument();
  });
});
