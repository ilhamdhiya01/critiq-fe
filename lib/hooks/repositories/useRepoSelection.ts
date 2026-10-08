import { useCallback, useState } from "react";

import {
  countSelectedRepos,
  deselectRepos,
  EMPTY_REPO_SELECTION,
  markDefaultBranch,
  type RepoSelectionState,
  toConnectProjects,
  toggleBranchSelection,
  toggleRepoSelection,
} from "@/lib/helpers/repository.helper";

// Repo + branch picks shared by the onboarding wizard and the Settings
// "Connect repositories" modal.
export const useRepoSelection = () => {
  const [selection, setSelection] =
    useState<RepoSelectionState>(EMPTY_REPO_SELECTION);

  const toggleRepo = useCallback(
    (id: string) => setSelection((prev) => toggleRepoSelection(prev, id)),
    [],
  );

  const toggleBranch = useCallback(
    (repoId: string, branch: string) =>
      setSelection((prev) => toggleBranchSelection(prev, repoId, branch)),
    [],
  );

  const markBranchesReady = useCallback(
    (repoId: string, defaultBranch: string) =>
      setSelection((prev) => markDefaultBranch(prev, repoId, defaultBranch)),
    [],
  );

  const deselect = useCallback(
    (ids: string[]) => setSelection((prev) => deselectRepos(prev, ids)),
    [],
  );

  const toProjects = useCallback(
    () => toConnectProjects(selection),
    [selection],
  );

  return {
    selectedRepos: selection.selectedRepos,
    selectedBranches: selection.selectedBranches,
    selectedCount: countSelectedRepos(selection),
    toggleRepo,
    toggleBranch,
    markBranchesReady,
    deselectRepos: deselect,
    toProjects,
  };
};
