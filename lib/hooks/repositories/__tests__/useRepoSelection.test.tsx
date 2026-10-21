import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useRepoSelection } from "../useRepoSelection";

describe("useRepoSelection", () => {
  it("starts with nothing selected", () => {
    const { result } = renderHook(() => useRepoSelection());

    expect(result.current.selectedCount).toBe(0);
    expect(result.current.toProjects()).toEqual([]);
  });

  it("pre-selects the default branch once and builds the connect payload", () => {
    const { result } = renderHook(() => useRepoSelection());

    act(() => {
      result.current.toggleRepo("1");
      result.current.markBranchesReady("1", "main");
      result.current.toggleBranch("1", "dev");
      // A second load must not reset the user's picks.
      result.current.markBranchesReady("1", "main");
    });

    expect(result.current.selectedCount).toBe(1);
    expect(result.current.selectedBranches).toEqual({
      "1": { main: true, dev: true },
    });
    expect(result.current.toProjects()).toEqual([
      { id: "1", monitoredBranches: ["main", "dev"] },
    ]);
  });

  it("drops unpicked branches from the payload", () => {
    const { result } = renderHook(() => useRepoSelection());

    act(() => {
      result.current.toggleRepo("1");
      result.current.markBranchesReady("1", "main");
      result.current.toggleBranch("1", "main");
    });

    expect(result.current.toProjects()).toEqual([
      { id: "1", monitoredBranches: [] },
    ]);
  });

  it("forgets a repo's branches when it is unchecked", () => {
    const { result } = renderHook(() => useRepoSelection());

    act(() => {
      result.current.toggleRepo("1");
      result.current.markBranchesReady("1", "main");
      result.current.toggleRepo("1");
    });

    expect(result.current.selectedRepos).toEqual({ "1": false });
    expect(result.current.selectedBranches).toEqual({});
    expect(result.current.selectedCount).toBe(0);
  });

  it("deselects several repos at once, ignoring ones not selected", () => {
    const { result } = renderHook(() => useRepoSelection());

    act(() => {
      result.current.toggleRepo("1");
      result.current.toggleRepo("2");
      result.current.toggleRepo("3");
    });
    act(() => result.current.deselectRepos(["1", "3", "404"]));

    expect(result.current.selectedCount).toBe(1);
    expect(result.current.toProjects()).toEqual([
      { id: "2", monitoredBranches: [] },
    ]);
  });

  it("keeps action references stable across renders", () => {
    const { result } = renderHook(() => useRepoSelection());
    const { toggleRepo, toggleBranch, markBranchesReady, deselectRepos } =
      result.current;

    act(() => result.current.toggleRepo("1"));

    expect(result.current.toggleRepo).toBe(toggleRepo);
    expect(result.current.toggleBranch).toBe(toggleBranch);
    expect(result.current.markBranchesReady).toBe(markBranchesReady);
    expect(result.current.deselectRepos).toBe(deselectRepos);
  });
});
