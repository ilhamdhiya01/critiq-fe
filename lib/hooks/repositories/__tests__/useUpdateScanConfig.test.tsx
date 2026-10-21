import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  PROVIDER_ACCESS_ERROR_MESSAGE,
  SCAN_CONFIG_ERROR_MESSAGE,
  SCAN_CONFIG_FORBIDDEN_MESSAGE,
} from "@/const/repository.constant";
import { toast } from "@/lib/toast";
import type { BranchPolicyEntry } from "@/lib/types/repository.types";
import { updateScanConfig } from "@/services/repositories.service";

import { repositoryKeys } from "../queryKeys";
import { useUpdateScanConfig } from "../useUpdateScanConfig";

vi.mock("@/services/repositories.service", () => ({
  updateScanConfig: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const ROWS: BranchPolicyEntry[] = [
  { branch: "main", policy: "manual_only" },
  { branch: "ghost", policy: "allow_ai" },
];
const INPUT = { branches: ["main", "ghost"], policies: ROWS };

const setup = () => {
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useUpdateScanConfig("org_1", "repo_1"), {
    wrapper,
  });
  const invalidatedKeys = () =>
    invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { client, result, invalidatedKeys };
};

const rejectWith = (status: number, data: object, message = "boom") =>
  vi
    .mocked(updateScanConfig)
    .mockRejectedValue(
      Object.assign(new Error(message), { response: { status, data } }),
    );

const save = async (result: ReturnType<typeof setup>["result"]) => {
  let ok: boolean | undefined;
  await act(async () => {
    ok = await result.current.handleSaveScanConfig(INPUT, ROWS);
  });
  return ok;
};

describe("useUpdateScanConfig", () => {
  afterEach(() => vi.clearAllMocks());

  it("stores the saved config without a refetch", async () => {
    const response = { data: { branches: ["main", "ghost"], policies: ROWS } };
    vi.mocked(updateScanConfig).mockResolvedValue(response as never);
    const { client, result, invalidatedKeys } = setup();

    expect(await save(result)).toBe(true);

    expect(updateScanConfig).toHaveBeenCalledWith("org_1", "repo_1", INPUT);
    expect(
      client.getQueryData(repositoryKeys.scanConfig("org_1", "repo_1")),
    ).toEqual(response);
    expect(invalidatedKeys()).toEqual([repositoryKeys.org("org_1")]);
    expect(toast.success).toHaveBeenCalledWith("Review policies saved");
    expect(result.current.saveErrors).toEqual({
      rowErrors: {},
      formError: null,
    });
  });

  it("shows a form error on 403", async () => {
    rejectWith(403, {});
    const { result } = setup();

    expect(await save(result)).toBe(false);

    expect(result.current.saveErrors).toEqual({
      rowErrors: {},
      formError: SCAN_CONFIG_FORBIDDEN_MESSAGE,
    });
  });

  it("explains a provider access problem on 409", async () => {
    rejectWith(409, { message: "github_uninstalled" });
    const { result } = setup();

    await save(result);

    expect(result.current.saveErrors.formError).toBe(
      PROVIDER_ACCESS_ERROR_MESSAGE.github_uninstalled,
    );
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("toasts a 409 it cannot explain", async () => {
    rejectWith(409, { message: "something_else" }, "Conflict");
    const { result } = setup();

    await save(result);

    expect(toast.error).toHaveBeenCalledWith("Conflict");
    expect(result.current.saveErrors.formError).toBeNull();
  });

  it("puts validation errors on the matching rows", async () => {
    rejectWith(422, {
      errors: [
        { field: "branches", message: "unknown_branch", branch: "ghost" },
      ],
    });
    const { result } = setup();

    await save(result);

    expect(result.current.saveErrors).toEqual({
      rowErrors: { ghost: SCAN_CONFIG_ERROR_MESSAGE.unknown_branch },
      formError: null,
    });
  });

  it("falls back to the error message when a 400 maps to nothing", async () => {
    rejectWith(400, { errors: [] }, "Bad request");
    const { result } = setup();

    await save(result);

    expect(result.current.saveErrors).toEqual({
      rowErrors: {},
      formError: "Bad request",
    });

    act(() => result.current.clearSaveErrors());
    expect(result.current.saveErrors).toEqual({
      rowErrors: {},
      formError: null,
    });
  });

  it("toasts unexpected failures", async () => {
    rejectWith(500, {}, "Server error");
    const { result } = setup();

    expect(await save(result)).toBe(false);

    expect(toast.error).toHaveBeenCalledWith("Server error");
  });
});
