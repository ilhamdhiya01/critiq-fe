import { create } from "zustand";

interface DiffJumpTarget {
  filePath: string;
  line: number;
}

interface DiffJumpState {
  // The line most recently jumped to, cleared once the highlight fades.
  target: DiffJumpTarget | null;
}

interface DiffJumpActions {
  setTarget: (target: DiffJumpTarget) => void;
  clearTarget: () => void;
}

type DiffJumpStore = DiffJumpState & DiffJumpActions;

const InitialState: DiffJumpState = {
  target: null,
};

// Lives in a store rather than props: the Flagged Issues card and the diff row
// are siblings three levels apart, and threading a transient highlight through
// PullRequestDetail → PullRequestDiff → DiffFile would make every one of them
// re-render on a purely visual event.
export const useDiffJumpStore = create<DiffJumpStore>((set) => ({
  ...InitialState,
  setTarget: (target) => set({ target }),
  clearTarget: () => set({ target: null }),
}));
