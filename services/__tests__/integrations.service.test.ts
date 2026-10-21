import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosInstance from "@/lib/axios";

import { createOrganization } from "../integrations.service";

vi.mock("@/lib/axios", () => ({
  default: { post: vi.fn(), patch: vi.fn() },
}));

const ORG = { id: "org_new", name: "Acme", slug: "acme" };

describe("createOrganization", () => {
  beforeEach(() => {
    vi.mocked(axiosInstance.post)
      .mockReset()
      .mockResolvedValue({ data: { data: ORG } });
    vi.mocked(axiosInstance.patch)
      .mockReset()
      .mockResolvedValue({ data: { data: ORG } });
  });

  it("creates an org (POST) when the wizard has none yet", async () => {
    await createOrganization({ name: "Acme" });

    expect(axiosInstance.post).toHaveBeenCalledWith(
      expect.stringMatching(/\/orgs$/),
      { name: "Acme" },
    );
    expect(axiosInstance.patch).not.toHaveBeenCalled();
  });

  it("renames it (PATCH) once it exists", async () => {
    await createOrganization({ name: "Acme Corp", organizationId: "org_new" });

    expect(axiosInstance.patch).toHaveBeenCalledWith(
      expect.stringMatching(/\/orgs\/org_new$/),
      { name: "Acme Corp" },
    );
    expect(axiosInstance.post).not.toHaveBeenCalled();
  });
});
