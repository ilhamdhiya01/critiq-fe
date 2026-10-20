import type {
  DiffLine,
  ParsedPullRequestFile,
} from "@/lib/types/pull-request.types";

const HUNK_HEADER = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/;

export const parseUnifiedPatch = (patch: string): DiffLine[] => {
  const lines: DiffLine[] = [];
  let oldLine = 0;
  let newLine = 0;

  for (const raw of patch.split("\n")) {
    const match = HUNK_HEADER.exec(raw);
    if (match) {
      oldLine = Number(match[1]);
      newLine = Number(match[2]);
      lines.push({
        type: "hunk",
        oldLineNumber: null,
        newLineNumber: null,
        content: raw,
      });
      continue;
    }

    // Trailing split artifact, or "\ No newline at end of file"
    if (raw === "" || raw.startsWith("\\")) continue;

    const marker = raw[0];
    const content = raw.slice(1);

    if (marker === "+") {
      lines.push({
        type: "added",
        oldLineNumber: null,
        newLineNumber: newLine++,
        content,
      });
    } else if (marker === "-") {
      lines.push({
        type: "removed",
        oldLineNumber: oldLine++,
        newLineNumber: null,
        content,
      });
    } else {
      lines.push({
        type: "context",
        oldLineNumber: oldLine++,
        newLineNumber: newLine++,
        content,
      });
    }
  }

  return lines;
};

// One row of the virtualised diff: every file is flattened into a single list
// so only what is on screen gets rendered.
export type DiffListItem =
  | { kind: "header"; fileIndex: number }
  | { kind: "line"; fileIndex: number; lineIndex: number }
  | { kind: "message"; fileIndex: number; message: "unavailable" | "truncated" }
  | { kind: "end"; fileIndex: number };

export interface DiffList {
  items: DiffListItem[];
  // Stable React/virtualizer key per item.
  keys: string[];
  // Item index of each file's header, in file order.
  headerIndexes: number[];
  // "path:newLineNumber" → item index, for jumping to a finding.
  lineIndexByKey: Map<string, number>;
}

export const getDiffJumpKey = (filePath: string, line: number) =>
  `${filePath}:${line}`;

export const buildDiffList = (
  files: readonly ParsedPullRequestFile[],
): DiffList => {
  const items: DiffListItem[] = [];
  const keys: string[] = [];
  const headerIndexes: number[] = [];
  const lineIndexByKey = new Map<string, number>();
  const push = (item: DiffListItem, key: string) => {
    items.push(item);
    keys.push(key);
  };

  files.forEach((file, fileIndex) => {
    headerIndexes.push(items.length);
    push({ kind: "header", fileIndex }, `${file.path}#header`);

    if (file.patch !== null && file.lines.length > 0) {
      file.lines.forEach((line, lineIndex) => {
        if (line.newLineNumber !== null) {
          lineIndexByKey.set(
            getDiffJumpKey(file.path, line.newLineNumber),
            items.length,
          );
        }
        push(
          { kind: "line", fileIndex, lineIndex },
          `${file.path}#${lineIndex}`,
        );
      });
    } else {
      push(
        { kind: "message", fileIndex, message: "unavailable" },
        `${file.path}#unavailable`,
      );
    }
    if (file.truncated) {
      push(
        { kind: "message", fileIndex, message: "truncated" },
        `${file.path}#truncated`,
      );
    }
    push({ kind: "end", fileIndex }, `${file.path}#end`);
  });

  return { items, keys, headerIndexes, lineIndexByKey };
};

// Index of the last header starting at or before `offset` (binary search over
// the headers' start positions), or -1.
export const findHeaderAt = (
  headerStarts: readonly number[],
  offset: number,
): number => {
  let low = 0;
  let high = headerStarts.length - 1;
  let found = -1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (headerStarts[mid] <= offset) {
      found = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return found;
};
