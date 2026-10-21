import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ActiveOrgTestProvider from "@/lib/test-utils/ActiveOrgTestProvider";

import {
  useActiveMembership,
  useActiveOrg,
  useActiveOrgId,
} from "../useActiveOrg";

const Probe = () => {
  const orgId = useActiveOrgId();
  const membership = useActiveMembership();
  const { isLoading } = useActiveOrg();
  return (
    <span>
      {orgId ?? "none"}|{membership?.role ?? "no-role"}|
      {isLoading ? "loading" : "ready"}
    </span>
  );
};

describe("useActiveOrg", () => {
  it("reads the org and membership from ActiveOrgProvider", () => {
    render(
      <ActiveOrgTestProvider orgId="org_9" role="REVIEWER">
        <Probe />
      </ActiveOrgTestProvider>,
    );

    expect(screen.getByText("org_9|REVIEWER|ready")).toBeInTheDocument();
  });

  it("tells a loading org apart from a missing provider", () => {
    render(
      <ActiveOrgTestProvider orgId={undefined} isLoading>
        <Probe />
      </ActiveOrgTestProvider>,
    );
    expect(screen.getByText("none|no-role|loading")).toBeInTheDocument();
  });

  it("fails loudly outside the provider instead of loading forever", () => {
    // React logs the thrown error; keep the test output clean.
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => render(<Probe />)).toThrow(
      "useActiveOrg must be used inside ActiveOrgProvider",
    );
    consoleError.mockRestore();
  });
});
