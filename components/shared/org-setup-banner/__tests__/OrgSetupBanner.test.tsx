import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ActiveOrgTestProvider from "@/lib/test-utils/ActiveOrgTestProvider";
import type { Role } from "@/lib/types/auth.types";
import type { Integration } from "@/lib/types/integration.types";
import { getIntegrations } from "@/services/integrations.service";

import OrgSetupBanner from "../OrgSetupBanner";

vi.mock("next/navigation", () => ({
  useParams: () => ({ slug: "acme" }),
}));

vi.mock("@/services/integrations.service", () => ({
  getIntegrations: vi.fn(),
}));

// The real modal loads repo candidates; only the provider it opens with
// matters here.
vi.mock("@/components/shared/connect-repositories-modal", () => ({
  default: ({ provider }: { provider: string }) => (
    <div role="dialog">Pick {provider} repositories</div>
  ),
}));

const integration = (source: "GITHUB" | "GITLAB", state = "ACTIVE") =>
  ({ source, state }) as Integration;

const renderBanner = (role: Role, onboardingCompleted = false) =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <ActiveOrgTestProvider
        orgId="org_1"
        role={role}
        onboardingCompleted={onboardingCompleted}
      >
        <OrgSetupBanner />
      </ActiveOrgTestProvider>
    </QueryClientProvider>,
  );

const addRepository = () =>
  screen.getByRole("button", { name: "Add repository" });

describe("OrgSetupBanner", () => {
  beforeEach(() => {
    vi.mocked(getIntegrations).mockReset();
    vi.mocked(getIntegrations).mockResolvedValue({ data: [] });
  });

  it("asks an Admin to connect first while nothing is connected", async () => {
    renderBanner("ADMIN");

    expect(
      screen.getByText(
        /Finish setting up Acme: connect GitHub or GitLab and add a repository/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Connect" })).toHaveAttribute(
      "href",
      "/acme/settings#integrations",
    );
    await waitFor(() => expect(getIntegrations).toHaveBeenCalledWith("org_1"));
    expect(addRepository()).toBeDisabled();
    expect(addRepository()).toHaveAttribute(
      "title",
      "Connect GitHub or GitLab first",
    );
  });

  it("lets an Admin add a repository once GitHub is active", async () => {
    vi.mocked(getIntegrations).mockResolvedValue({
      data: [integration("GITHUB")],
    });
    renderBanner("ADMIN");

    await waitFor(() => expect(addRepository()).toBeEnabled());
    fireEvent.click(addRepository());
    expect(screen.getByRole("dialog")).toHaveTextContent(
      "Pick GITHUB repositories",
    );
  });

  it("uses GitLab when that is what is connected", async () => {
    vi.mocked(getIntegrations).mockResolvedValue({
      data: [integration("GITHUB", "UNINSTALLED"), integration("GITLAB")],
    });
    renderBanner("ADMIN");

    await waitFor(() => expect(addRepository()).toBeEnabled());
    fireEvent.click(addRepository());
    expect(screen.getByRole("dialog")).toHaveTextContent(
      "Pick GITLAB repositories",
    );
  });

  it.each(["REVIEWER", "VIEWER"] as const)(
    "tells a %s to ask an Admin, with no actions",
    (role) => {
      renderBanner(role);

      expect(
        screen.getByText(
          "This organization has no repositories yet. Ask an Admin to connect one.",
        ),
      ).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
      expect(getIntegrations).not.toHaveBeenCalled();
    },
  );

  it("renders nothing once the org has a repository", () => {
    const { container } = renderBanner("ADMIN", true);

    expect(container).toBeEmptyDOMElement();
    expect(getIntegrations).not.toHaveBeenCalled();
  });
});
